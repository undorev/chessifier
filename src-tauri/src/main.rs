#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod chess;
mod db;
mod error;
mod fide;
mod fs;
mod lexer;
mod oauth;
mod opening;
mod pgn;
mod puzzle;
mod telemetry;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::{fs::create_dir_all};

use chess::{BestMovesPayload, EngineProcess, ReportProgress};
use dashmap::DashMap;
use db::{DatabaseProgress, GameQueryJs, NormalizedGame, PositionStats};
use derivative::Derivative;
use fide::FidePlayer;
use log::LevelFilter;
use oauth::AuthState;
use specta_typescript::{BigIntExportBehavior, Typescript};
use sysinfo::SystemExt;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, Window};

use crate::chess::{
    analyze_game, get_engine_config, get_engine_logs, kill_engine, kill_engines, stop_engine,
};
use crate::db::{
    clear_games, convert_pgn, create_indexes, delete_database, delete_db_game, delete_empty_games,
    delete_indexes, export_to_pgn, get_player, get_players_game_info, get_tournaments,
    search_position,
};
use crate::fide::{download_fide_db, find_fide_player};
use crate::fs::{set_file_as_executable, DownloadProgress};
use crate::lexer::lex_pgn;
use crate::oauth::authenticate;
use crate::pgn::{count_pgn_games, delete_game, read_games, write_game};
use crate::puzzle::{get_puzzle, get_puzzle_db_info};
use crate::telemetry::{get_telemetry_config, get_telemetry_enabled, handle_first_run_telemetry, set_telemetry_enabled};
use crate::{
    chess::get_best_moves,
    db::{
        delete_duplicated_games, edit_db_info, get_db_info, get_games, get_game, get_players, merge_players, update_game
    },
    fs::{download_file, file_exists, get_file_metadata},
    opening::{get_opening_from_fen, get_opening_from_name, search_opening_name},
};
use tokio::sync::{RwLock, Semaphore};

pub type GameData = (
    i32,
    i32,
    i32,
    Option<String>,
    Option<String>,
    Vec<u8>,
    Option<String>,
    i32,
    i32,
    i32,
);

#[derive(Derivative)]
#[derivative(Default)]
pub struct AppState {
    connection_pool: DashMap<
        String,
        diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<diesel::SqliteConnection>>,
    >,
    line_cache: DashMap<(GameQueryJs, PathBuf), (Vec<PositionStats>, Vec<NormalizedGame>)>,
    db_cache: Mutex<Vec<GameData>>,
    #[derivative(Default(value = "Arc::new(Semaphore::new(2))"))]
    new_request: Arc<Semaphore>,
    pgn_offsets: DashMap<String, Vec<u64>>,
    fide_players: RwLock<Vec<FidePlayer>>,
    engine_processes: DashMap<(String, String), Arc<tokio::sync::Mutex<EngineProcess>>>,
    auth: AuthState,
}

const REQUIRED_DIRS: &[(BaseDirectory, &str)] = &[
    (BaseDirectory::AppData, "engines"),
    (BaseDirectory::AppData, "db"),
    (BaseDirectory::AppData, "presets"),
    (BaseDirectory::AppData, "puzzles"),
    (BaseDirectory::AppData, "documents"),
    (BaseDirectory::Document, "Chessifier"),
];

const REQUIRED_FILES: &[(BaseDirectory, &str, &str)] =
    &[(BaseDirectory::AppData, "engines/engines.json", "[]")];

/// Ensures that all required directories exist, creating them if necessary
///
/// # Arguments
/// * `app` - The Tauri app handle used to resolve paths
///
/// # Returns
/// * `Ok(())` if all directories were created or already exist
/// * `Err(String)` if there was an error creating a directory
fn ensure_required_directories(app: &AppHandle) -> Result<(), String> {
    log::info!("Checking for required directories");
    for &(dir, path) in REQUIRED_DIRS {
        let resolved_path = app.path().resolve(path, dir)
            .map_err(|e| format!("Failed to resolve path {path}: {e}"))?;
        
        if !resolved_path.exists() {
            log::info!("Creating directory {}", resolved_path.display());
            create_dir_all(&resolved_path).map_err(|e| {
                format!("Failed to create directory {}: {e}", resolved_path.display())
            })?;
        } else {
            log::info!("Directory already exists: {}", resolved_path.display());
        }
    }
    Ok(())
}

/// Ensures that all required files exist, creating them with default content if necessary
///
/// # Arguments
/// * `app` - The Tauri app handle used to resolve paths
///
/// # Returns
/// * `Ok(())` if all files were created or already exist
/// * `Err(String)` if there was an error creating a file
fn ensure_required_files(app: &AppHandle) -> Result<(), String> {
    log::info!("Checking for required files");
    for &(dir, path, contents) in REQUIRED_FILES {
        let resolved_path = app
            .path()
            .resolve(path, dir)
            .map_err(|e| format!("Failed to resolve path {path}: {e}"))?;

        if !resolved_path.exists() {
            log::info!("Creating file {}", resolved_path.display());
            std::fs::write(&resolved_path, contents).map_err(|e| {
                format!("Failed to write file {}: {e}", resolved_path.display())
            })?;
        } else {
            log::info!("File already exists: {}", resolved_path.display());
        }
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn close_splashscreen(window: Window) -> Result<(), String> {
    // Get the main window, returning an error if not found
    let main_window = window
        .get_webview_window("main")
        .ok_or_else(|| String::from("No window labeled 'main' found"))?;

    // Show the main window, propagating any errors
    main_window
        .show()
        .map_err(|e| format!("Failed to show main window: {}", e))?;

    Ok(())
}

#[tokio::main]
async fn main() {
    let specta_builder = tauri_specta::Builder::new()
        .commands(tauri_specta::collect_commands!(
            close_splashscreen,
            find_fide_player,
            get_best_moves,
            analyze_game,
            stop_engine,
            kill_engine,
            kill_engines,
            get_engine_logs,
            memory_size,
            get_puzzle,
            search_opening_name,
            get_opening_from_fen,
            get_opening_from_name,
            get_players_game_info,
            get_engine_config,
            file_exists,
            get_file_metadata,
            merge_players,
            convert_pgn,
            get_player,
            count_pgn_games,
            read_games,
            lex_pgn,
            is_bmi2_compatible,
            delete_game,
            delete_duplicated_games,
            delete_empty_games,
            clear_games,
            set_file_as_executable,
            delete_indexes,
            create_indexes,
            edit_db_info,
            delete_db_game,
            delete_database,
            export_to_pgn,
            authenticate,
            write_game,
            download_fide_db,
            download_file,
            get_tournaments,
            get_db_info,
            get_games,
            get_game,
            update_game,
            search_position,
            get_players,
            get_puzzle_db_info,
            get_telemetry_enabled,
            set_telemetry_enabled,
            get_telemetry_config
        ))
        .events(tauri_specta::collect_events!(
            BestMovesPayload,
            DatabaseProgress,
            DownloadProgress,
            ReportProgress
        ));

    #[cfg(debug_assertions)]
    specta_builder
        .export(
            Typescript::default().bigint(BigIntExportBehavior::BigInt),
            "../src/bindings/generated.ts",
        )
        .expect("Failed to export types");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("chessifier".to_string()),
                    },
                ))
                .level(LevelFilter::Info).build())
        .invoke_handler(specta_builder.invoke_handler())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_aptabase::Builder::new("A-EU-1317838572").build())
        .setup(move |app| {
            log::info!("Setting up application");

            // Ensure required directories exist
            ensure_required_directories(&app.handle())?;

            // Ensure required files exist
            ensure_required_files(&app.handle())?;

            // #[cfg(any(windows, target_os = "macos"))]
            // set_shadow(&app.get_webview_window("main").unwrap(), true).unwrap();

            specta_builder.mount_events(app);

            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_cli::init())?;

            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            let _ = log::info!("Finished rust initialization");
            // Handle first-run telemetry based on user preferences
            let _ = handle_first_run_telemetry(&app.handle());
            Ok(())
        })
        .manage(AppState::default())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
#[specta::specta]
fn is_bmi2_compatible() -> bool {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    if is_x86_feature_detected!("bmi2") {
        return true;
    }
    false
}

#[tauri::command]
#[specta::specta]
fn memory_size() -> u64 {
    sysinfo::System::new_all().total_memory() / (1024 * 1024)
}
