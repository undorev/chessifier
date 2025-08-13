use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;
use tauri_plugin_aptabase::EventTracker;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub first_run_completed: bool,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            first_run_completed: false,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("Failed to resolve config path: {0}")]
    PathError(String),
    #[error("Failed to read config file: {0}")]
    ReadError(#[from] std::io::Error),
    #[error("Failed to parse config: {0}")]
    ParseError(#[from] serde_json::Error),
}

impl TelemetryConfig {
    fn get_config_path(app: &AppHandle) -> Result<PathBuf, TelemetryError> {
        app.path()
            .resolve("telemetry_config.json", BaseDirectory::AppConfig)
            .map_err(|e| TelemetryError::PathError(e.to_string()))
    }

    pub fn load(app: &AppHandle) -> Result<Self, TelemetryError> {
        let config_path = Self::get_config_path(app)?;
        
        if !config_path.exists() {
            log::info!("Telemetry config not found, creating default");
            let default_config = Self::default();
            default_config.save(app)?;
            return Ok(default_config);
        }

        let config_content = fs::read_to_string(&config_path)?;
        let config: Self = serde_json::from_str(&config_content)?;
        
        log::info!("Loaded telemetry config: enabled={}, first_run_completed={}", 
                  config.enabled, config.first_run_completed);
        
        Ok(config)
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), TelemetryError> {
        let config_path = Self::get_config_path(app)?;
        
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let config_json = serde_json::to_string_pretty(self)?;
        fs::write(&config_path, config_json)?;
        
        log::info!("Saved telemetry config to: {}", config_path.display());
        Ok(())
    }

    pub fn set_enabled(&mut self, app: &AppHandle, enabled: bool) -> Result<(), TelemetryError> {
        self.enabled = enabled;
        self.save(app)?;
        log::info!("Telemetry enabled state updated to: {}", enabled);
        Ok(())
    }

    pub fn mark_first_run_completed(&mut self, app: &AppHandle) -> Result<(), TelemetryError> {
        self.first_run_completed = true;
        self.save(app)?;
        log::info!("First run marked as completed");
        Ok(())
    }
}

fn track_event_safe(app: &AppHandle, event_name: &str) {
    match app.track_event(event_name, None) {
        Ok(_) => {
            log::info!("Successfully tracked '{}' event", event_name);
        }
        Err(e) => {
            log::warn!("Failed to track '{}' event: {}. This is normal if analytics are disabled or not configured.", event_name, e);
        }
    }
}

pub fn handle_first_run_telemetry(app: &AppHandle) -> Result<(), String> {
    let mut config = TelemetryConfig::load(app)
        .map_err(|e| format!("Failed to load telemetry config: {}", e))?;

    if config.enabled && !config.first_run_completed {
        log::info!("First run detected and telemetry enabled. Tracking 'first_run' event.");

        track_event_safe(app, "first_run");

        config.mark_first_run_completed(app)
            .map_err(|e| format!("Failed to mark first run as completed: {}", e))?;
    } else if !config.enabled {
        log::info!("Telemetry disabled, skipping first_run tracking");
        if !config.first_run_completed {
            config.mark_first_run_completed(app)
                .map_err(|e| format!("Failed to mark first run as completed: {}", e))?;
        }
    } else {
        log::info!("First run already completed, skipping tracking");
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn get_telemetry_enabled(app: AppHandle) -> Result<bool, String> {
    let config = TelemetryConfig::load(&app)
        .map_err(|e| format!("Failed to load telemetry config: {}", e))?;
    
    Ok(config.enabled)
}

#[tauri::command]
#[specta::specta]
pub fn set_telemetry_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut config = TelemetryConfig::load(&app)
        .map_err(|e| format!("Failed to load telemetry config: {}", e))?;
    
    config.set_enabled(&app, enabled)
        .map_err(|e| format!("Failed to update telemetry setting: {}", e))?;
    
    log::info!("Telemetry preference updated: enabled={}", enabled);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn get_telemetry_config(app: AppHandle) -> Result<TelemetryConfig, String> {
    TelemetryConfig::load(&app)
        .map_err(|e| format!("Failed to load telemetry config: {}", e))
}
