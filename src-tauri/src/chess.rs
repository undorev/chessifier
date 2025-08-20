use std::{
    fmt::Display,
    path::PathBuf,
    process::Stdio,
    sync::{Arc, LazyLock},
    time::{Duration, Instant},
};

use derivative::Derivative;
use governor::{Quota, RateLimiter};
use log::{error, info};
use nonzero_ext::*;
use serde::{Deserialize, Serialize};
use shakmaty::{
    fen::Fen, san::SanPlus, uci::UciMove, ByColor, CastlingMode, Chess, Color, EnPassantMode,
    Position, Role,
};
use specta::Type;
use tauri_specta::Event;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader, Lines},
    process::{Child, ChildStdin, ChildStdout, Command},
    sync::Mutex,
};
use vampirc_uci::{
    parse_one,
    uci::{Score, ScoreValue},
    UciInfoAttribute, UciMessage, UciOptionConfig,
};

use crate::{
    db::{is_position_in_db, GameQueryJs, PositionQueryJs},
    error::Error,
    AppState,
};

// Create rate limiter once as a static
static PROGRESS_RATE_LIMITER: LazyLock<RateLimiter<governor::state::direct::NotKeyed, governor::state::InMemoryState, governor::clock::DefaultClock>> = 
    LazyLock::new(|| RateLimiter::direct(Quota::per_second(nonzero!(5u32))));

// Constants for magic numbers
const ENGINE_STOP_DELAY_MS: u64 = 50;
const COMPLETION_PROGRESS: f64 = 100.0;
const NEAR_COMPLETION_PROGRESS: f64 = 99.99;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum EngineLog {
    Gui(String),
    Engine(String),
}

#[derive(Debug)]
pub struct EngineProcess {
    stdin: ChildStdin,
    last_depth: u32,
    best_moves: Vec<BestMoves>,
    last_best_moves: Vec<BestMoves>,
    last_progress: f32,
    last_event_sent: Option<Instant>,
    options: EngineOptions,
    go_mode: GoMode,
    running: bool,
    real_multipv: u16,
    logs: Vec<EngineLog>,
    start: Instant,
}

impl EngineProcess {
    async fn new(path: PathBuf) -> Result<(Self, Lines<BufReader<ChildStdout>>), Error> {
        let mut command = Command::new(&path);
        command.current_dir(path.parent().unwrap());
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(target_os = "windows")]
        command.creation_flags(CREATE_NO_WINDOW);

        let mut child = command.spawn()?;

        let mut logs = Vec::new();

        let mut stdin = child.stdin.take().ok_or(Error::NoStdin)?;

        tokio::spawn(async move {
            let mut stderr = BufReader::new(child.stderr.take().unwrap()).lines();
            while let Some(line) = stderr.next_line().await.unwrap() {
                error!("{}", &line);
            }
        });

        let mut lines = BufReader::new(child.stdout.take().ok_or(Error::NoStdout)?).lines();

        let _ = stdin.write_all("uci\n".as_bytes()).await;
        logs.push(EngineLog::Gui("uci\n".to_string()));
        while let Some(line) = lines.next_line().await? {
            logs.push(EngineLog::Engine(line.clone()));
            if line == "uciok" {
                let _ = stdin.write_all("isready\n".as_bytes()).await;
                logs.push(EngineLog::Gui("isready\n".to_string()));
                while let Some(line_is_ready) = lines.next_line().await? {
                    logs.push(EngineLog::Engine(line_is_ready.clone()));
                    if line_is_ready == "readyok" {
                        break;
                    }
                }
                break;
            }
        }

        Ok((
            Self {
                stdin,
                last_depth: 0,
                best_moves: Vec::new(),
                last_best_moves: Vec::new(),
                last_progress: 0.0,
                last_event_sent: None,
                logs,
                options: EngineOptions::default(),
                real_multipv: 0,
                go_mode: GoMode::Infinite,
                running: false,
                start: Instant::now(),
            },
            lines,
        ))
    }

    async fn set_option<T>(&mut self, name: &str, value: T) -> Result<(), Error>
    where
        T: Display,
    {
        let msg = format!("setoption name {} value {}\n", name, value);
        self.stdin.write_all(msg.as_bytes()).await?;
        self.logs.push(EngineLog::Gui(msg));

        Ok(())
    }

    async fn set_options(&mut self, options: EngineOptions) -> Result<(), Error> {
        // Parse and validate the position
        let fen: Fen = options.fen.parse()?;
        let mut current_position: Chess = match fen.into_position(CastlingMode::Chess960) {
            Ok(position) => position,
            Err(error) => error.ignore_too_much_material()?,
        };
        
        // Apply all moves to get the current position
        for move_str in &options.moves {
            let uci_move = UciMove::from_ascii(move_str.as_bytes())?;
            let chess_move = uci_move.to_move(&current_position)?;
            current_position.play_unchecked(&chess_move);
        }
        
        // Extract and validate MultiPV setting
        let multi_pv_value = self.extract_multi_pv_value(&options.extra_options)?;
        let legal_move_count = current_position.legal_moves().len() as u16;
        self.real_multipv = multi_pv_value.min(legal_move_count);

        // Set engine options that have changed
        for option in &options.extra_options {
            if !self.options.extra_options.contains(option) {
                self.set_option(&option.name, &option.value).await?;
            }
        }

        // Update position if it has changed
        let position_changed = options.fen != self.options.fen || options.moves != self.options.moves;
        if position_changed {
            self.set_position(&options.fen, &options.moves).await?;
        }

        // Reset state for new analysis
        self.reset_analysis_state();
        self.options = options.clone();
        
        Ok(())
    }

    /// Extract MultiPV value from engine options with proper error handling
    fn extract_multi_pv_value(&self, extra_options: &[EngineOption]) -> Result<u16, Error> {
        let multi_pv_str = extra_options
            .iter()
            .find(|option| option.name == "MultiPV")
            .map(|option| option.value.as_str())
            .unwrap_or("1");
            
        multi_pv_str.parse::<u16>()
            .map_err(|_| Error::InvalidMultiPvValue(multi_pv_str.to_string()))
            .map(|value| if value == 0 { 1 } else { value })
    }

    /// Reset analysis state when starting new analysis
    fn reset_analysis_state(&mut self) {
        self.last_depth = 0;
        self.best_moves.clear();
        self.last_best_moves.clear();
    }

    async fn set_position(&mut self, fen: &str, moves: &[String]) -> Result<(), Error> {
        let msg = if moves.is_empty() {
            format!("position fen {fen}\n")
        } else {
            format!("position fen {fen} moves {}\n", moves.join(" "))
        };

        self.stdin.write_all(msg.as_bytes()).await?;
        self.options.fen = fen.to_string();
        self.options.moves = moves.to_vec();
        self.logs.push(EngineLog::Gui(msg));
        Ok(())
    }

    async fn go(&mut self, mode: &GoMode) -> Result<(), Error> {
        self.go_mode = mode.clone();
        let msg = match mode {
            GoMode::Depth(depth) => format!("go depth {depth}\n"),
            GoMode::Time(time) => format!("go movetime {time}\n"),
            GoMode::Nodes(nodes) => format!("go nodes {nodes}\n"),
            GoMode::PlayersTime(PlayersTime {
                white,
                black,
                winc,
                binc,
            }) => {
                format!("go wtime {white} btime {black} winc {winc} binc {binc}\n")
            }
            GoMode::Infinite => "go infinite\n".to_string(),
        };
        self.stdin.write_all(msg.as_bytes()).await?;
        self.logs.push(EngineLog::Gui(msg));
        self.running = true;
        self.start = Instant::now();
        self.last_event_sent = None;
        Ok(())
    }

    async fn stop(&mut self) -> Result<(), Error> {
        self.stdin.write_all(b"stop\n").await?;
        self.logs.push(EngineLog::Gui("stop\n".to_string()));
        self.running = false;
        Ok(())
    }

    async fn kill(&mut self) -> Result<(), Error> {
        self.stdin.write_all(b"quit\n").await?;
        self.logs.push(EngineLog::Gui("quit\n".to_string()));
        self.running = false;
        Ok(())
    }
}

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct AnalysisCacheKey {
    pub tab: String,
    pub fen: String,
    pub engine: String,
    pub multipv: u16,
}

#[derive(Clone, Serialize, Debug, Derivative, Type)]
#[derivative(Default)]
pub struct BestMoves {
    nodes: u32,
    depth: u32,
    score: Score,
    #[serde(rename = "uciMoves")]
    uci_moves: Vec<String>,
    #[serde(rename = "sanMoves")]
    san_moves: Vec<String>,
    #[derivative(Default(value = "1"))]
    multipv: u16,
    nps: u32,
}

#[derive(Serialize, Debug, Clone, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct BestMovesPayload {
    pub best_lines: Vec<BestMoves>,
    pub engine: String,
    pub tab: String,
    pub fen: String,
    pub moves: Vec<String>,
    pub progress: f64,
}

fn invert_score(score: Score) -> Score {
    let new_value = match score.value {
        ScoreValue::Cp(x) => ScoreValue::Cp(-x),
        ScoreValue::Mate(x) => ScoreValue::Mate(-x),
    };
    let new_wdl = score.wdl.map(|(w, d, l)| (l, d, w));
    Score {
        value: new_value,
        wdl: new_wdl,
        ..score
    }
}

fn parse_uci_attrs(
    attrs: Vec<UciInfoAttribute>,
    fen: &Fen,
    moves: &[String],
) -> Result<Option<BestMoves>, Error> {
    let mut best_moves = BestMoves::default();
    let mut has_pv = false; // Track if we found a PV (principal variation)

    let mut pos: Chess = match fen.clone().into_position(CastlingMode::Chess960) {
        Ok(p) => p,
        Err(e) => e.ignore_too_much_material()?,
    };
    
    for m in moves {
        let uci = UciMove::from_ascii(m.as_bytes())?;
        let mv = uci.to_move(&pos)?;
        pos.play_unchecked(&mv);
    }
    let turn = pos.turn();

    for a in attrs {
        match a {
            UciInfoAttribute::Pv(m) => {
                has_pv = true;
                for mv in m {
                    let uci: UciMove = mv.to_string().parse()?;
                    let m = uci.to_move(&pos)?;
                    let san = SanPlus::from_move_and_play_unchecked(&mut pos, &m);
                    best_moves.san_moves.push(san.to_string());
                    best_moves.uci_moves.push(uci.to_string());
                }
            }
            UciInfoAttribute::Nps(nps) => {
                best_moves.nps = nps as u32;
            }
            UciInfoAttribute::Nodes(nodes) => {
                best_moves.nodes = nodes as u32;
            }
            UciInfoAttribute::Depth(depth) => {
                best_moves.depth = depth;
            }
            UciInfoAttribute::MultiPv(multipv) => {
                best_moves.multipv = multipv;
            }
            UciInfoAttribute::Score(score) => {
                best_moves.score = score;
            }
            _ => {}
        }
    }

    // Only return an error if we expected moves but the PV was empty
    // If there's no PV attribute at all, this is a normal info message without moves
    if has_pv && best_moves.san_moves.is_empty() {
        return Err(Error::NoMovesFound);
    }
    
    // If this info message doesn't contain moves, return None to indicate it should be skipped
    if !has_pv {
        return Ok(None);
    }

    if turn == Color::Black {
        best_moves.score = invert_score(best_moves.score);
    }

    Ok(Some(best_moves))
}

fn start_engine(path: PathBuf) -> Result<Child, Error> {
    let mut command = Command::new(&path);
    
    // For Homebrew-installed engines, try to set a better working directory
    if let Some(parent) = path.parent() {
        command.current_dir(parent);
    } else {
        // Fallback to user's home directory for Homebrew engines
        if let Some(home_dir) = std::env::var_os("HOME") {
            command.current_dir(home_dir);
        }
    }
    
    command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env("TERM", "dumb"); // Prevent engines from trying to use terminal features

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let child = command.spawn()?;

    Ok(child)
}

fn get_handles(child: &mut Child) -> Result<(ChildStdin, Lines<BufReader<ChildStdout>>), Error> {
    let stdin = child.stdin.take().ok_or(Error::NoStdin)?;
    let stdout = child.stdout.take().ok_or(Error::NoStdout)?;
    let stdout = BufReader::new(stdout).lines();
    Ok((stdin, stdout))
}

async fn send_command(stdin: &mut ChildStdin, command: impl AsRef<str>) -> Result<(), Error> {
    stdin
        .write_all(command.as_ref().as_bytes())
        .await
        .map_err(|e| Error::Io(e))?;
    Ok(())
}

#[derive(Deserialize, Debug, Clone, Type, Derivative, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
#[derivative(Default)]
pub struct EngineOptions {
    pub fen: String,
    pub moves: Vec<String>,
    pub extra_options: Vec<EngineOption>,
}

#[derive(Deserialize, Debug, Clone, Type, PartialEq, Eq)]
pub struct EngineOption {
    name: String,
    value: String,
}

#[derive(Deserialize, Debug, Clone, Type, PartialEq, Eq)]
#[serde(tag = "t", content = "c")]
pub enum GoMode {
    PlayersTime(PlayersTime),
    Depth(u32),
    Time(u32),
    Nodes(u32),
    Infinite,
}

#[derive(Deserialize, Debug, Clone, Type, PartialEq, Eq)]
pub struct PlayersTime {
    white: u32,
    black: u32,
    winc: u32,
    binc: u32,
}

#[tauri::command]
#[specta::specta]
pub async fn kill_engines(tab: String, state: tauri::State<'_, AppState>) -> Result<(), Error> {
    let keys: Vec<_> = state
        .engine_processes
        .iter()
        .map(|x| x.key().clone())
        .collect();
    for key in keys.clone() {
        if key.0.starts_with(&tab) {
            {
                let process = state.engine_processes.get_mut(&key).unwrap();
                let mut process = process.lock().await;
                process.kill().await?;
            }
            state.engine_processes.remove(&key);
        }
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn kill_engine(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), Error> {
    let key = (tab, engine);
    if let Some(process) = state.engine_processes.get(&key) {
        let mut process = process.lock().await;
        process.kill().await?;
    }
    Ok(())
}
#[tauri::command]
#[specta::specta]
pub async fn stop_engine(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), Error> {
    let key = (tab, engine);
    if let Some(process) = state.engine_processes.get(&key) {
        let mut process = process.lock().await;
        process.stop().await?;
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_engine_logs(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<EngineLog>, Error> {
    let key = (tab, engine);
    if let Some(process) = state.engine_processes.get(&key) {
        let process = process.lock().await;
        Ok(process.logs.clone())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
#[specta::specta]
pub async fn get_best_moves(
    id: String,
    engine: String,
    tab: String,
    go_mode: GoMode,
    options: EngineOptions,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<(f32, Vec<BestMoves>)>, Error> {
    let engine_path = PathBuf::from(&engine);
    let process_key = (tab.clone(), engine.clone());

    // Try to reuse existing engine process
    if let Some(existing_result) = try_reuse_existing_process(&process_key, &options, &go_mode, &state).await? {
        return Ok(Some(existing_result));
    }

    // Create new engine process
    let (new_process, reader) = create_new_engine_process(engine_path, &options, &go_mode).await?;
    let process_arc = Arc::new(Mutex::new(new_process));
    
    // Insert into state before starting the analysis loop
    state.engine_processes.insert(process_key.clone(), process_arc.clone());

    // Start the analysis loop
    let result = run_analysis_loop(reader, process_arc, &id, &tab, &app).await;
    
    // Clean up process from state
    state.engine_processes.remove(&process_key);
    
    if let Err(ref error) = result {
        log::error!("Engine analysis failed: tab: {}, engine: {}, error: {:?}", tab, engine, error);
    } else {
        log::info!("Engine process finished: tab: {}, engine: {}", tab, engine);
    }
    
    result.map(|_| None)
}

/// Try to reuse an existing engine process if conditions are met
async fn try_reuse_existing_process(
    process_key: &(String, String),
    options: &EngineOptions,
    go_mode: &GoMode,
    state: &tauri::State<'_, AppState>,
) -> Result<Option<(f32, Vec<BestMoves>)>, Error> {
    let Some(process_ref) = state.engine_processes.get(process_key) else {
        return Ok(None);
    };

    let mut process = process_ref.lock().await;
    
    // Check if we can return cached results
    if *options == process.options && *go_mode == process.go_mode && process.running {
        return Ok(Some((
            process.last_progress,
            process.last_best_moves.clone(),
        )));
    }

    // Stop the current analysis and restart with new parameters
    process.stop().await?;
    drop(process); // Release lock before sleep
    
    tokio::time::sleep(Duration::from_millis(ENGINE_STOP_DELAY_MS)).await;
    
    let mut process = process_ref.lock().await;
    process.set_options(options.clone()).await?;
    process.go(go_mode).await?;
    
    Ok(None)
}

/// Create a new engine process with the given options
async fn create_new_engine_process(
    engine_path: PathBuf,
    options: &EngineOptions,
    go_mode: &GoMode,
) -> Result<(EngineProcess, Lines<BufReader<ChildStdout>>), Error> {
    let (mut process, reader) = EngineProcess::new(engine_path).await?;
    process.set_options(options.clone()).await?;
    process.go(go_mode).await?;
    Ok((process, reader))
}

/// Main analysis loop that processes UCI messages
async fn run_analysis_loop(
    mut reader: Lines<BufReader<ChildStdout>>,
    process_arc: Arc<Mutex<EngineProcess>>,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
) -> Result<(), Error> {
    while let Some(line) = reader.next_line().await? {
        let mut process_guard = process_arc.lock().await;
        
        match parse_one(&line) {
            UciMessage::Info(attrs) => {
                handle_info_message(attrs, &mut process_guard, id, tab, app).await?;
            }
            UciMessage::BestMove { .. } => {
                handle_best_move_message(&process_guard, id, tab, app).await?;
            }
            _ => {} // Ignore other UCI messages
        }
        
        process_guard.logs.push(EngineLog::Engine(line));
    }
    
    Ok(())
}

/// Handle UCI Info messages containing analysis data
async fn handle_info_message(
    attrs: Vec<UciInfoAttribute>,
    process: &mut EngineProcess,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
) -> Result<(), Error> {
    // Parse UCI attributes - this may return None for info messages without moves
    let Some(best_moves) = parse_uci_attrs(attrs, &process.options.fen.parse()?, &process.options.moves)? else {
        // This info message doesn't contain moves (e.g., just depth/nodes updates), skip it
        return Ok(());
    };
    
    let multipv = best_moves.multipv;
    let current_depth = best_moves.depth;
    
    // Check if this is the expected next line in the multi-PV sequence
    if multipv as usize != process.best_moves.len() + 1 {
        return Ok(());
    }
    
    process.best_moves.push(best_moves);
    
    // If we've collected all expected lines for this depth
    if multipv == process.real_multipv {
        if should_emit_progress_update(process, current_depth)? {
            emit_progress_update(process, id, tab, app, current_depth).await?;
        }
        process.best_moves.clear();
    }
    
    Ok(())
}

/// Determine if we should emit a progress update
fn should_emit_progress_update(process: &EngineProcess, current_depth: u32) -> Result<bool, Error> {
    let all_same_depth = process.best_moves.iter().all(|moves| moves.depth == current_depth);
    let depth_progressed = current_depth >= process.last_depth;
    let rate_limit_ok = PROGRESS_RATE_LIMITER.check().is_ok();
    
    Ok(all_same_depth && depth_progressed && rate_limit_ok)
}

/// Emit a progress update event
async fn emit_progress_update(
    process: &mut EngineProcess,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
    current_depth: u32,
) -> Result<(), Error> {
    let progress = calculate_progress(process)?;
    
    let payload = BestMovesPayload {
        best_lines: process.best_moves.clone(),
        engine: id.to_string(),
        tab: tab.to_string(),
        fen: process.options.fen.clone(),
        moves: process.options.moves.clone(),
        progress,
    };
    
    payload.emit(app)?;
    
    // Update process state
    process.last_depth = current_depth;
    process.last_best_moves = process.best_moves.clone();
    process.last_progress = progress as f32;
    
    Ok(())
}

/// Calculate analysis progress based on the go mode
fn calculate_progress(process: &EngineProcess) -> Result<f64, Error> {
    let progress = match &process.go_mode {
        GoMode::Depth(target_depth) => {
            let current_depth = process.best_moves.first()
                .map(|moves| moves.depth)
                .unwrap_or(0) as f64;
            (current_depth / *target_depth as f64) * COMPLETION_PROGRESS
        }
        GoMode::Time(target_time_ms) => {
            let elapsed_ms = process.start.elapsed().as_millis() as f64;
            (elapsed_ms / *target_time_ms as f64) * COMPLETION_PROGRESS
        }
        GoMode::Nodes(target_nodes) => {
            let current_nodes = process.best_moves.first()
                .map(|moves| moves.nodes)
                .unwrap_or(0) as f64;
            (current_nodes / *target_nodes as f64) * COMPLETION_PROGRESS
        }
        GoMode::PlayersTime(_) | GoMode::Infinite => NEAR_COMPLETION_PROGRESS,
    };
    
    Ok(progress.min(COMPLETION_PROGRESS))
}

/// Handle UCI BestMove message (analysis completion)
async fn handle_best_move_message(
    process: &EngineProcess,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
) -> Result<(), Error> {
    let payload = BestMovesPayload {
        best_lines: process.last_best_moves.clone(),
        engine: id.to_string(),
        tab: tab.to_string(),
        fen: process.options.fen.clone(),
        moves: process.options.moves.clone(),
        progress: COMPLETION_PROGRESS,
    };
    
    payload.emit(app)?;
    
    Ok(())
}

#[derive(Serialize, Debug, Default, Type)]
pub struct MoveAnalysis {
    best: Vec<BestMoves>,
    novelty: bool,
    is_sacrifice: bool,
}

#[derive(Deserialize, Debug, Default, Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisOptions {
    pub fen: String,
    pub moves: Vec<String>,
    pub annotate_novelties: bool,
    pub reference_db: Option<PathBuf>,
    pub reversed: bool,
}

#[derive(Clone, Type, serde::Serialize, Event)]
pub struct ReportProgress {
    pub progress: f64,
    pub id: String,
    pub finished: bool,
}

#[tauri::command]
#[specta::specta]
pub async fn analyze_game(
    id: String,
    engine: String,
    go_mode: GoMode,
    options: AnalysisOptions,
    uci_options: Vec<EngineOption>,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<Vec<MoveAnalysis>, Error> {
    let path = PathBuf::from(&engine);
    let mut analysis: Vec<MoveAnalysis> = Vec::new();

    let (mut proc, mut reader) = EngineProcess::new(path).await?;

    let fen = Fen::from_ascii(options.fen.as_bytes())?;

    let mut chess: Chess = fen.clone().into_position(CastlingMode::Chess960)?;
    let mut fens: Vec<(Fen, Vec<String>, bool)> = vec![(fen, vec![], false)];

    options.moves.iter().enumerate().for_each(|(i, m)| {
        let uci = UciMove::from_ascii(m.as_bytes()).unwrap();
        let m = uci.to_move(&chess).unwrap();
        let previous_pos = chess.clone();
        chess.play_unchecked(&m);
        let current_pos = chess.clone();
        if !chess.is_game_over() {
            let prev_eval = naive_eval(&previous_pos);
            let cur_eval = -naive_eval(&current_pos);
            fens.push((
                Fen::from_position(current_pos, EnPassantMode::Legal),
                options.moves.clone().into_iter().take(i + 1).collect(),
                prev_eval > cur_eval + 100,
            ));
        }
    });

    if options.reversed {
        fens.reverse();
    }

    let mut novelty_found = false;

    for (i, (_, moves, _)) in fens.iter().enumerate() {
        ReportProgress {
            progress: (i as f64 / fens.len() as f64) * 100.0,
            id: id.clone(),
            finished: false,
        }
        .emit(&app)?;

        let mut extra_options = uci_options.clone();
        if !extra_options.iter().any(|x| x.name == "MultiPV") {
            extra_options.push(EngineOption {
                name: "MultiPV".to_string(),
                value: "2".to_string(),
            });
        } else {
            extra_options.iter_mut().for_each(|x| {
                if x.name == "MultiPV" {
                    x.value = "2".to_string();
                }
            });
        }

        proc.set_options(EngineOptions {
            fen: options.fen.clone(),
            moves: moves.clone(),
            extra_options,
        })
        .await?;

        proc.go(&go_mode).await?;

        let mut current_analysis = MoveAnalysis::default();
        while let Ok(Some(line)) = reader.next_line().await {
            match parse_one(&line) {
                UciMessage::Info(attrs) => {
                    if let Ok(Some(best_moves)) =
                        parse_uci_attrs(attrs, &proc.options.fen.parse()?, moves)
                    {
                        let multipv = best_moves.multipv;
                        let cur_depth = best_moves.depth;
                        if multipv as usize == proc.best_moves.len() + 1 {
                            proc.best_moves.push(best_moves);
                            if multipv == proc.real_multipv {
                                if proc.best_moves.iter().all(|x| x.depth == cur_depth)
                                    && cur_depth >= proc.last_depth
                                {
                                    current_analysis.best = proc.best_moves.clone();
                                    proc.last_depth = cur_depth;
                                }
                                assert_eq!(proc.best_moves.len(), proc.real_multipv as usize);
                                proc.best_moves.clear();
                            }
                        }
                    }
                }
                UciMessage::BestMove { .. } => {
                    break;
                }
                _ => {}
            }
        }
        analysis.push(current_analysis);
    }

    if options.reversed {
        analysis.reverse();
        fens.reverse();
    }

    for (i, analysis) in analysis.iter_mut().enumerate() {
        let fen = &fens[i].0;
        // let query = PositionQuery::exact_from_fen(&fen.to_string())?;
        let query = PositionQueryJs {
            fen: fen.to_string(),
            type_: "exact".to_string(),
        };

        analysis.is_sacrifice = fens[i].2;
        if options.annotate_novelties && !novelty_found {
            if let Some(reference) = options.reference_db.clone() {
                analysis.novelty = !is_position_in_db(
                    reference,
                    GameQueryJs::new().position(query.clone()).clone(),
                    state.clone(),
                )
                .await?;
                if analysis.novelty {
                    novelty_found = true;
                }
            } else {
                return Err(Error::MissingReferenceDatabase);
            }
        }
    }
    ReportProgress {
        progress: 100.0,
        id: id.clone(),
        finished: true,
    }
    .emit(&app)?;
    Ok(analysis)
}

fn count_material(position: &Chess) -> i32 {
    if position.is_checkmate() {
        return -10000;
    }
    let material: ByColor<i32> = position.board().material().map(|p| {
        p.pawn as i32 * piece_value(Role::Pawn)
            + p.knight as i32 * piece_value(Role::Knight)
            + p.bishop as i32 * piece_value(Role::Bishop)
            + p.rook as i32 * piece_value(Role::Rook)
            + p.queen as i32 * piece_value(Role::Queen)
    });
    if position.turn() == Color::White {
        material.white - material.black
    } else {
        material.black - material.white
    }
}

fn piece_value(role: Role) -> i32 {
    match role {
        Role::Pawn => 90,
        Role::Knight => 300,
        Role::Bishop => 300,
        Role::Rook => 500,
        Role::Queen => 1000,
        _ => 0,
    }
}

fn qsearch(position: &Chess, mut alpha: i32, beta: i32) -> i32 {
    let stand_pat = count_material(position);

    if stand_pat >= beta {
        return beta;
    }
    if alpha < stand_pat {
        alpha = stand_pat;
    }
    let legal_moves = position.legal_moves();
    let mut captures: Vec<_> = legal_moves.iter().filter(|m| m.is_capture()).collect();

    captures.sort_by(|a, b| {
        let a_value = piece_value(a.capture().unwrap());
        let b_value = piece_value(b.capture().unwrap());
        b_value.cmp(&a_value)
    });

    for capture in captures {
        let mut new_position = position.clone();
        new_position.play_unchecked(capture);
        let score = -qsearch(&new_position, -beta, -alpha);
        if score >= beta {
            return beta;
        }
        if score > alpha {
            alpha = score;
        }
    }

    alpha
}

fn naive_eval(pos: &Chess) -> i32 {
    pos.legal_moves()
        .iter()
        .map(|mv| {
            let mut new_position = pos.clone();
            new_position.play_unchecked(mv);
            -qsearch(&new_position, i32::MIN, i32::MAX)
        })
        .max()
        .unwrap_or(i32::MIN)
}

#[cfg(test)]
mod tests {
    use shakmaty::FromSetup;

    use super::*;

    fn pos(fen: &str) -> Chess {
        let fen: Fen = fen.parse().unwrap();
        Chess::from_setup(fen.into_setup(), CastlingMode::Chess960).unwrap()
    }

    #[test]
    fn eval_start_pos() {
        assert_eq!(naive_eval(&Chess::default()), 0);
    }

    #[test]
    fn eval_scandi() {
        let position = pos("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
        assert_eq!(naive_eval(&position), 0);
    }

    #[test]
    fn eval_hanging_pawn() {
        let position = pos("r1bqkbnr/ppp1pppp/2n5/1B1p4/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3");
        assert_eq!(naive_eval(&position), 100);
    }

    #[test]
    fn eval_complex_center() {
        let position = pos("r1bqkbnr/ppp2ppp/2n5/1B1pp3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4");
        assert_eq!(naive_eval(&position), 100);
    }

    #[test]
    fn eval_in_check() {
        let position = pos("r1bqkbnr/ppp2ppp/2B5/3pp3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4");
        assert_eq!(naive_eval(&position), -100);
    }

    #[test]
    fn eval_rook_stack() {
        let position = pos("rnrq4/8/8/1R6/1R6/1R5K/1Q6/7k w - - 0 1");
        assert_eq!(naive_eval(&position), 500);
    }

    #[test]
    fn eval_rook_stack2() {
        let position = pos("rnrq4/8/8/1R6/1Q6/1R5K/1R6/7k w - - 0 1");
        assert_eq!(naive_eval(&position), 200);
    }

    #[test]
    fn eval_opera_game1() {
        let position = pos("4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2K4R w k - 0 14");
        assert_eq!(naive_eval(&position), -100);
    }

    #[test]
    fn eval_opera_game2() {
        let position = pos("4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 b k - 1 14");
        assert_eq!(naive_eval(&position), 0);
    }
}

#[derive(Type, Default, Serialize, Debug)]
pub struct EngineConfig {
    pub name: String,
    pub options: Vec<UciOptionConfig>,
}

#[tauri::command]
#[specta::specta]
pub async fn get_engine_config(path: PathBuf) -> Result<EngineConfig, Error> {
    let mut child = start_engine(path.clone())?;
    let (mut stdin, mut stdout) = get_handles(&mut child)?;

    let _ = send_command(&mut stdin, "uci\n").await;

    let mut config = EngineConfig::default();
    
    // Add timeout to prevent hanging
    let timeout_duration = Duration::from_secs(10);
    let start_time = Instant::now();

    loop {
        if start_time.elapsed() > timeout_duration {
            // Kill the process and return a minimal config
            let _ = child.kill().await;
            info!("Engine config timeout for path: {:?}", path);
            config.name = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Engine")
                .to_string();
            break;
        }

        match tokio::time::timeout(Duration::from_millis(100), stdout.next_line()).await {
            Ok(Ok(Some(line))) => {
                if let UciMessage::Id {
                    name: Some(name),
                    author: _,
                } = parse_one(&line)
                {
                    config.name = name;
                }
                if let UciMessage::Option(opt) = parse_one(&line) {
                    config.options.push(opt);
                }
                if let UciMessage::UciOk = parse_one(&line) {
                    break;
                }
            }
            Ok(Ok(None)) => {
                // Engine closed stdout
                break;
            }
            Ok(Err(_)) => {
                // Error reading from stdout
                break;
            }
            Err(_) => {
                // Timeout waiting for line, continue loop to check overall timeout
                continue;
            }
        }
    }
    
    // Ensure child process is terminated
    let _ = child.kill().await;
    
    // If we got no name, use the filename
    if config.name.is_empty() {
        config.name = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown Engine")
            .to_string();
    }
    
    info!("Engine config retrieved: name={}, options_count={}", config.name, config.options.len());
    Ok(config)
}
