use std::{
    fmt::Display,
    path::PathBuf,
    process::Stdio,
    sync::{Arc, LazyLock},
    time::{Duration, Instant},
};

use derivative::Derivative;
use governor::{Quota, RateLimiter};
use log::{error, info, warn, debug};
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
    sync::{Mutex, oneshot},
    time::{timeout, sleep},
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
    LazyLock::new(|| RateLimiter::direct(Quota::per_second(nonzero!(20u32))));

// Constants for engine management
const ENGINE_STOP_DELAY_MS: u64 = 50;
const ENGINE_RESPONSE_TIMEOUT_MS: u64 = 5000;
const ENGINE_INIT_TIMEOUT_MS: u64 = 10000;
const ENGINE_RESTART_DELAY_MS: u64 = 100;
const ENGINE_MAX_RESTART_ATTEMPTS: u32 = 3;
const COMPLETION_PROGRESS: f64 = 100.0;
const NEAR_COMPLETION_PROGRESS: f64 = 99.99;
const TIME_CONTROL_SAFETY_MARGIN_MS: u64 = 100;
const HASH_ALLOCATION_RETRY_ATTEMPTS: u32 = 3;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum EngineLog {
    Gui(String),
    Engine(String),
    Error(String),
    Warning(String),
}

#[derive(Debug, Clone, PartialEq)]
pub enum EngineState {
    Starting,
    Ready,
    Thinking,
    Stopping,
    Crashed,
    Unresponsive,
}

#[derive(Debug)]
pub struct EngineProcess {
    stdin: ChildStdin,
    child: Option<Child>,
    path: PathBuf,
    state: EngineState,
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
    restart_count: u32,
    last_activity: Instant,
    game_ended: bool,
    time_remaining_ms: Option<u64>,
    shutdown_sender: Option<oneshot::Sender<()>>,
}

impl EngineProcess {
    async fn new(path: PathBuf) -> Result<(Self, Lines<BufReader<ChildStdout>>), Error> {
        debug!("Starting new engine process: {}", path.display());
        
        let mut command = Command::new(&path);
        command.current_dir(path.parent().unwrap());
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(target_os = "windows")]
        command.creation_flags(CREATE_NO_WINDOW);

        let mut child = command.spawn().map_err(|e| {
            error!("Failed to spawn engine process: {}", e);
            Error::EngineCrashed(format!("Failed to spawn: {}", e))
        })?;

        let mut logs = Vec::new();
        let mut stdin = child.stdin.take().ok_or(Error::NoStdin)?;

        // Spawn stderr handler
        if let Some(stderr) = child.stderr.take() {
            tokio::spawn(async move {
                let mut stderr = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = stderr.next_line().await {
                    warn!("Engine stderr: {}", line);
                }
            });
        }

        let mut lines = BufReader::new(child.stdout.take().ok_or(Error::NoStdout)?).lines();

        // Initialize UCI with timeout
        Self::initialize_uci(&mut stdin, &mut lines, &mut logs).await?;

        let now = Instant::now();
        Ok((
            Self {
                stdin,
                child: Some(child),
                path: path.clone(),
                state: EngineState::Ready,
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
                start: now,
                restart_count: 0,
                last_activity: now,
                game_ended: false,
                time_remaining_ms: None,
                shutdown_sender: None,
            },
            lines,
        ))
    }

    async fn initialize_uci(
        stdin: &mut ChildStdin,
        lines: &mut Lines<BufReader<ChildStdout>>,
        logs: &mut Vec<EngineLog>,
    ) -> Result<(), Error> {
        debug!("Initializing UCI protocol");
        
        // Send UCI command with timeout
        let _ = stdin.write_all("uci\n".as_bytes()).await;
        logs.push(EngineLog::Gui("uci\n".to_string()));
        
        let uci_timeout = timeout(Duration::from_millis(ENGINE_INIT_TIMEOUT_MS), async {
            while let Some(line) = lines.next_line().await? {
                logs.push(EngineLog::Engine(line.clone()));
                if line == "uciok" {
                    return Ok::<(), Error>(());
                }
            }
            Err(Error::EngineTimeout("UCI initialization".to_string()))
        }).await;

        match uci_timeout {
            Ok(Ok(())) => {
                debug!("UCI initialization successful");
            }
            Ok(Err(e)) => return Err(e),
            Err(_) => {
                return Err(Error::EngineTimeout("UCI initialization timeout".to_string()));
            }
        }

        // Send isready command with timeout
        let _ = stdin.write_all("isready\n".as_bytes()).await;
        logs.push(EngineLog::Gui("isready\n".to_string()));
        
        let ready_timeout = timeout(Duration::from_millis(ENGINE_RESPONSE_TIMEOUT_MS), async {
            while let Some(line) = lines.next_line().await? {
                logs.push(EngineLog::Engine(line.clone()));
                if line == "readyok" {
                    return Ok::<(), Error>(());
                }
            }
            Err(Error::EngineTimeout("isready".to_string()))
        }).await;

        match ready_timeout {
            Ok(Ok(())) => {
                debug!("Engine ready");
                Ok(())
            }
            Ok(Err(e)) => Err(e),
            Err(_) => Err(Error::EngineTimeout("isready timeout".to_string())),
        }
    }

    async fn restart(&mut self) -> Result<Lines<BufReader<ChildStdout>>, Error> {
        if self.restart_count >= ENGINE_MAX_RESTART_ATTEMPTS {
            return Err(Error::EngineCrashed(
                "Maximum restart attempts exceeded".to_string()
            ));
        }

        warn!("Restarting engine (attempt {})", self.restart_count + 1);
        self.restart_count += 1;
        
        // Kill existing process if it exists
        if let Some(mut child) = self.child.take() {
            let _ = child.kill().await;
        }

        // Wait before restart
        sleep(Duration::from_millis(ENGINE_RESTART_DELAY_MS)).await;

        // Create new process
        let (new_engine, lines) = Self::new(self.path.clone()).await?;
        
        // Transfer state
        *self = new_engine;
        self.restart_count += 1;
        
        // Re-apply options if they were set
        if !self.options.fen.is_empty() {
            self.set_options(self.options.clone()).await?;
        }

        info!("Engine restarted successfully");
        Ok(lines)
    }

    fn is_responsive(&self) -> bool {
        self.last_activity.elapsed() < Duration::from_millis(ENGINE_RESPONSE_TIMEOUT_MS * 2)
    }

    fn mark_activity(&mut self) {
        self.last_activity = Instant::now();
    }

    async fn set_option<T>(&mut self, name: &str, value: T) -> Result<(), Error>
    where
        T: Display,
    {
        let msg = format!("setoption name {} value {}\n", name, value);
    // Log the option being set for easier debugging of engine configuration
    info!("Setting engine option: {} = {}", name, value);
        
        // Handle hash allocation with retry logic
        if name.to_lowercase() == "hash" {
            return self.set_hash_with_retry(&value.to_string()).await;
        }
        
        if let Err(e) = self.stdin.write_all(msg.as_bytes()).await {
            self.state = EngineState::Unresponsive;
            return Err(Error::EngineCommunication(format!("Failed to send option: {}", e)));
        }
        
        self.logs.push(EngineLog::Gui(msg));
        self.mark_activity();
        Ok(())
    }

    async fn set_hash_with_retry(&mut self, hash_value: &str) -> Result<(), Error> {
        let mut attempts = 0;
        let mut current_hash = hash_value.parse::<u64>().unwrap_or(128);
        
        while attempts < HASH_ALLOCATION_RETRY_ATTEMPTS {
            let msg = format!("setoption name Hash value {}\n", current_hash);
            
            if let Err(e) = self.stdin.write_all(msg.as_bytes()).await {
                return Err(Error::EngineCommunication(format!("Failed to send hash: {}", e)));
            }
            
            self.logs.push(EngineLog::Gui(msg));
            
            // Wait a bit and check if engine is still responsive
            sleep(Duration::from_millis(100)).await;
            
            if self.is_responsive() {
                info!("Hash allocation successful: {}MB", current_hash);
                return Ok(());
            }
            
            attempts += 1;
            current_hash = current_hash / 2; // Reduce hash size
            warn!("Hash allocation attempt {} failed, trying {}MB", attempts, current_hash);
            
            if current_hash < 16 {
                break;
            }
        }
        
        self.logs.push(EngineLog::Warning(
            format!("Hash allocation failed, using minimal hash: 16MB")
        ));
        
        let msg = "setoption name Hash value 16\n";
        if let Err(e) = self.stdin.write_all(msg.as_bytes()).await {
            return Err(Error::HashAllocationFailed(format!("Even minimal hash failed: {}", e)));
        }
        
        self.logs.push(EngineLog::Gui(msg.to_string()));
        Ok(())
    }

    async fn set_options(&mut self, options: EngineOptions) -> Result<(), Error> {
        if self.state == EngineState::Crashed {
            return Err(Error::InvalidEngineState("Engine crashed".to_string()));
        }

        // Log the incoming engine options (including extra options) so we can inspect depth-related settings
        info!("Applying engine options: fen={}, moves_count={}, extra_options={:?}", options.fen, options.moves.len(), options.extra_options);

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
        
        // Check if game has ended
        self.game_ended = current_position.is_game_over();
        if self.game_ended {
            warn!("Attempting to analyze a finished game");
            return Err(Error::InvalidEngineState("Game has ended".to_string()));
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
        self.running = false;
        self.start = Instant::now();
        self.mark_activity();
    }

    async fn set_position(&mut self, fen: &str, moves: &[String]) -> Result<(), Error> {
        let msg = if moves.is_empty() {
            format!("position fen {fen}\n")
        } else {
            format!("position fen {fen} moves {}\n", moves.join(" "))
        };

        if let Err(e) = self.stdin.write_all(msg.as_bytes()).await {
            self.state = EngineState::Unresponsive;
            return Err(Error::EngineCommunication(format!("Failed to send position: {}", e)));
        }
        
        self.options.fen = fen.to_string();
        self.options.moves = moves.to_vec();
        self.logs.push(EngineLog::Gui(msg));
        self.mark_activity();
        Ok(())
    }

    async fn go(&mut self, mode: &GoMode) -> Result<(), Error> {
        if self.state == EngineState::Crashed {
            return Err(Error::InvalidEngineState("Engine crashed".to_string()));
        }

        if self.game_ended {
            return Err(Error::InvalidEngineState("Game has ended, cannot start analysis".to_string()));
        }

        self.go_mode = mode.clone();

        // Log the requested go mode (depth/time/nodes) before sending the command
        match mode {
            GoMode::Depth(d) => info!("Starting analysis with depth={}", d),
            GoMode::Time(ms) => info!("Starting analysis with movetime={}ms", ms),
            GoMode::Nodes(n) => info!("Starting analysis with nodes={}", n),
            GoMode::PlayersTime(pts) => info!("Starting analysis with players time: white={} black={} winc={} binc={} depth={}", pts.white, pts.black, pts.winc, pts.binc, pts.depth),
            GoMode::Infinite => info!("Starting analysis in infinite mode"),
        }

        let msg = self.build_go_command(mode)?;

        if let Err(e) = self.stdin.write_all(msg.as_bytes()).await {
            self.state = EngineState::Unresponsive;
            return Err(Error::EngineCommunication(format!("Failed to send go command: {}", e)));
        }
        
    // Also log the exact go command that will be sent to the engine
    info!("Sending go command: {}", msg.trim_end());
    self.logs.push(EngineLog::Gui(msg));
        self.running = true;
        self.state = EngineState::Thinking;
        self.start = Instant::now();
        self.last_event_sent = None;
        self.mark_activity();
        
        debug!("Started engine analysis with mode: {:?}", mode);
        Ok(())
    }

    fn build_go_command(&mut self, mode: &GoMode) -> Result<String, Error> {
        let msg = match mode {
            GoMode::Depth(depth) => {
                info!("Building go command for depth {}", depth);
                // For depth searches, use a time-limited approach for better responsiveness
                // instead of letting the engine run to full depth
                if *depth >= 15 {
                    // For deep searches, use movetime to prevent long waits
                    let time_ms = if *depth <= 18 { 3000 } else { 5000 };
                    self.time_remaining_ms = Some(time_ms);
                    info!("Converting depth {} to movetime {}ms for responsiveness", depth, time_ms);
                    format!("go movetime {time_ms}\n")
                } else {
                    // For shallow searches, depth is fine
                    info!("Using direct depth command for shallow depth {}", depth);
                    format!("go depth {depth}\n")
                }
            },
            GoMode::Time(time) => {
                // Apply safety margin to prevent timeouts
                let safe_time = (*time).saturating_sub(TIME_CONTROL_SAFETY_MARGIN_MS as u32);
                self.time_remaining_ms = Some(safe_time as u64);
                format!("go movetime {safe_time}\n")
            },
            GoMode::Nodes(nodes) => format!("go nodes {nodes}\n"),
            GoMode::PlayersTime(PlayersTime { white, black, winc, binc, depth }) => {
                // Apply safety margins to time controls
                let safe_white = (*white).saturating_sub(TIME_CONTROL_SAFETY_MARGIN_MS as u32);
                let safe_black = (*black).saturating_sub(TIME_CONTROL_SAFETY_MARGIN_MS as u32);
                
                // Track time remaining for timeout detection
                self.time_remaining_ms = Some(safe_white.min(safe_black) as u64);
                
                format!("go wtime {safe_white} btime {safe_black} winc {winc} binc {binc} depth {depth}\n")
            }
            GoMode::Infinite => "go infinite\n".to_string(),
        };
        
        info!("Generated go command: {}", msg.trim_end());
        Ok(msg)
    }

    async fn stop(&mut self) -> Result<(), Error> {
        if !self.running || self.state != EngineState::Thinking {
            debug!("Engine not running, stop command ignored");
            return Ok(());
        }

        debug!("Stopping engine analysis");
        self.state = EngineState::Stopping;
        
        if let Err(e) = self.stdin.write_all(b"stop\n").await {
            warn!("Failed to send stop command: {}", e);
            self.state = EngineState::Unresponsive;
            return Err(Error::EngineCommunication(format!("Failed to stop engine: {}", e)));
        }
        
        self.logs.push(EngineLog::Gui("stop\n".to_string()));
        self.running = false;
        self.mark_activity();
        Ok(())
    }

    async fn kill(&mut self) -> Result<(), Error> {
        debug!("Killing engine process");
        
        // Send shutdown signal if we have one
        if let Some(sender) = self.shutdown_sender.take() {
            let _ = sender.send(());
        }
        
        // Send quit command if possible
        if self.state != EngineState::Crashed && self.state != EngineState::Unresponsive {
            let _ = self.stdin.write_all(b"quit\n").await;
            self.logs.push(EngineLog::Gui("quit\n".to_string()));
        }
        
        // Force kill the process
        if let Some(mut child) = self.child.take() {
            if let Err(e) = child.kill().await {
                warn!("Failed to kill engine process: {}", e);
            }
        }
        
        self.running = false;
        self.state = EngineState::Crashed;
        Ok(())
    }

    fn check_timeout(&self) -> bool {
        if let Some(time_limit) = self.time_remaining_ms {
            let elapsed = self.start.elapsed().as_millis() as u64;
            elapsed > time_limit
        } else {
            false
        }
    }

    fn should_terminate(&self) -> bool {
        self.game_ended || 
        self.state == EngineState::Crashed || 
        self.state == EngineState::Unresponsive ||
        (!self.is_responsive() && self.running) ||
        self.check_timeout()
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

impl BestMoves {
    fn with_capacity() -> Self {
        Self {
            uci_moves: Vec::with_capacity(10),
            san_moves: Vec::with_capacity(10),
            multipv: 1,
            ..Default::default()
        }
    }
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

/// Optimized version that takes a pre-constructed position to avoid reconstruction
fn parse_uci_attrs_optimized(
    attrs: Vec<UciInfoAttribute>,
    base_position: &Chess,
) -> Result<Option<BestMoves>, Error> {
    let mut best_moves = BestMoves::with_capacity();
    let mut has_pv = false;

    let turn = base_position.turn();

    for a in attrs {
        match a {
            UciInfoAttribute::Pv(moves) => {
                has_pv = true;
                let mut pos = base_position.clone();
                
                for mv in moves {
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

    if !has_pv {
        return Ok(None);
    }
    
    if has_pv && best_moves.san_moves.is_empty() {
        return Err(Error::NoMovesFound);
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
    depth: u32,
}

#[tauri::command]
#[specta::specta]
pub async fn kill_engines(tab: String, state: tauri::State<'_, AppState>) -> Result<(), Error> {
    info!("Killing all engines for tab: {}", tab);
    
    let keys: Vec<_> = state
        .engine_processes
        .iter()
        .map(|x| x.key().clone())
        .collect();
        
    let mut kill_tasks = Vec::new();
    
    for key in keys {
        if key.0.starts_with(&tab) {
            if let Some(process_ref) = state.engine_processes.get(&key) {
                let process_ref = process_ref.clone();
                let engine_name = key.1.clone(); // Clone the engine name before moving
                kill_tasks.push(tokio::spawn(async move {
                    let mut process = process_ref.lock().await;
                    if let Err(e) = process.kill().await {
                        warn!("Failed to kill engine {}: {:?}", engine_name, e);
                    }
                }));
            }
            state.engine_processes.remove(&key);
        }
    }
    
    // Wait for all kill operations to complete
    for task in kill_tasks {
        let _ = task.await;
    }
    
    info!("Successfully killed all engines for tab: {}", tab);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn kill_engine(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), Error> {
    let key = (tab.clone(), engine.clone());
    
    if let Some(process_ref) = state.engine_processes.get(&key) {
        let mut process = process_ref.lock().await;
        process.kill().await?;
        info!("Successfully killed engine: {} for tab: {}", engine, tab);
    } else {
        debug!("Engine not found for kill: {} in tab: {}", engine, tab);
    }
    
    state.engine_processes.remove(&key);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn stop_engine(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), Error> {
    let key = (tab, engine.clone());
    
    if let Some(process_ref) = state.engine_processes.get(&key) {
        let mut process = process_ref.lock().await;
        process.stop().await?;
        info!("Successfully stopped engine: {}", engine);
    } else {
        debug!("Engine not found for stop: {}", engine);
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
pub async fn cleanup_tab_engines(tab: String, state: tauri::State<'_, AppState>) -> Result<(), Error> {
    info!("Cleaning up engines for tab: {}", tab);
    
    let keys_to_remove: Vec<_> = state
        .engine_processes
        .iter()
        .filter(|entry| entry.key().0 == tab)
        .map(|entry| entry.key().clone())
        .collect();
    
    for key in keys_to_remove {
        if let Some(process_ref) = state.engine_processes.get(&key) {
            let mut process = process_ref.lock().await;
            let _ = process.kill().await; // Don't fail if kill fails
        }
        state.engine_processes.remove(&key);
    }
    
    info!("Cleaned up {} engine(s) for tab: {}", state.engine_processes.len(), tab);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_engine_status(
    engine: String,
    tab: String,
    state: tauri::State<'_, AppState>,
) -> Result<Option<String>, Error> {
    let key = (tab, engine);
    
    if let Some(process_ref) = state.engine_processes.get(&key) {
        let process = process_ref.lock().await;
        let status = match process.state {
            EngineState::Starting => "starting",
            EngineState::Ready => "ready",
            EngineState::Thinking => "thinking",
            EngineState::Stopping => "stopping",
            EngineState::Crashed => "crashed",
            EngineState::Unresponsive => "unresponsive",
        };
        Ok(Some(status.to_string()))
    } else {
        Ok(None)
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

    debug!("Starting analysis for tab: {}, engine: {}", tab, engine);

    // Try to reuse existing engine process
    if let Some(existing_result) = try_reuse_existing_process(&process_key, &options, &go_mode, &state).await? {
        return Ok(Some(existing_result));
    }

    // Create new engine process with recovery mechanism
    let (new_process, reader) = create_new_engine_process_with_recovery(engine_path, &options, &go_mode).await?;
    let process_arc = Arc::new(Mutex::new(new_process));
    
    // Insert into state before starting the analysis loop
    state.engine_processes.insert(process_key.clone(), process_arc.clone());

    info!("start analysis for tab: {}, engine: {}", tab, engine);

    // Start the analysis loop with improved error handling
    let result = run_robust_analysis_loop(reader, process_arc.clone(), &id, &tab, &app).await;
    info!("end analysis for tab: {}, engine: {}, result: {:?}", tab, engine, result.is_ok());

    // Clean up process from state
    {
        let mut process_guard = process_arc.lock().await;
        let _ = process_guard.kill().await;
    }
    state.engine_processes.remove(&process_key);
    
    match result {
        Ok(_) => {
            debug!("Engine analysis completed successfully: tab: {}, engine: {}", tab, engine);
            Ok(None)
        }
        Err(error) => {
            error!("Engine analysis failed: tab: {}, engine: {}, error: {:?}", tab, engine, error);
            Err(error)
        }
    }
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
    
    // Check if engine is responsive
    if !process.is_responsive() {
        warn!("Engine unresponsive, will restart");
        return Ok(None);
    }
    
    // Check if we can return cached results
    if *options == process.options && *go_mode == process.go_mode && process.running {
        debug!("Returning cached results");
        return Ok(Some((
            process.last_progress,
            process.last_best_moves.clone(),
        )));
    }

    // Stop the current analysis and restart with new parameters
    process.stop().await?;
    drop(process); // Release lock before sleep
    
    sleep(Duration::from_millis(ENGINE_STOP_DELAY_MS)).await;
    
    let mut process = process_ref.lock().await;
    
    // Check if engine is still alive after stop
    if !process.is_responsive() {
        warn!("Engine became unresponsive after stop");
        return Ok(None);
    }
    
    process.set_options(options.clone()).await?;
    process.go(go_mode).await?;
    
    Ok(None)
}

/// Create a new engine process with recovery mechanism
async fn create_new_engine_process_with_recovery(
    engine_path: PathBuf,
    options: &EngineOptions,
    go_mode: &GoMode,
) -> Result<(EngineProcess, Lines<BufReader<ChildStdout>>), Error> {
    let mut attempts = 0;
    
    while attempts < ENGINE_MAX_RESTART_ATTEMPTS {
        match create_new_engine_process(engine_path.clone(), options, go_mode).await {
            Ok(result) => {
                info!("Engine process created successfully on attempt {}", attempts + 1);
                return Ok(result);
            }
            Err(e) => {
                attempts += 1;
                warn!("Engine creation attempt {} failed: {:?}", attempts, e);
                
                if attempts >= ENGINE_MAX_RESTART_ATTEMPTS {
                    return Err(Error::EngineCrashed(
                        format!("Failed to create engine after {} attempts: {}", attempts, e)
                    ));
                }
                
                sleep(Duration::from_millis(ENGINE_RESTART_DELAY_MS)).await;
            }
        }
    }
    
    unreachable!()
}

/// Create a new engine process with the given options
async fn create_new_engine_process(
    engine_path: PathBuf,
    options: &EngineOptions,
    go_mode: &GoMode,
) -> Result<(EngineProcess, Lines<BufReader<ChildStdout>>), Error> {
    debug!("Creating new engine process: {}", engine_path.display());
    let (mut process, reader) = EngineProcess::new(engine_path).await?;
    process.set_options(options.clone()).await?;
    
    // Use the go_mode as provided - don't override it with engine options
    // Engine options like "Depth" are for engine configuration, not for controlling the go command
    info!("Using requested go_mode: {:?}", go_mode);
    
    process.go(go_mode).await?;
    Ok((process, reader))
}

/// Main analysis loop with robust error handling and recovery
async fn run_robust_analysis_loop(
    mut reader: Lines<BufReader<ChildStdout>>,
    process_arc: Arc<Mutex<EngineProcess>>,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
) -> Result<(), Error> {
    // Cache position and options to avoid repeated mutex locks and position reconstruction
    let (cached_position, _cached_options, id_str, tab_str, go_mode) = {
        let process_guard = process_arc.lock().await;
        let fen: Fen = process_guard.options.fen.parse()?;
        let mut pos: Chess = match fen.into_position(CastlingMode::Chess960) {
            Ok(p) => p,
            Err(e) => e.ignore_too_much_material()?,
        };
        
        // Apply all moves to get current position
        for move_str in &process_guard.options.moves {
            let uci = UciMove::from_ascii(move_str.as_bytes())?;
            let mv = uci.to_move(&pos)?;
            pos.play_unchecked(&mv);
        }
        
        (pos, process_guard.options.clone(), id.to_string(), tab.to_string(), process_guard.go_mode.clone())
    };
    
    // Pre-allocate vectors for better performance
    let mut pending_info_messages = Vec::with_capacity(16);
    let mut log_buffer = Vec::with_capacity(32);
    let mut max_depth_reached = 0u32;
    let mut consecutive_errors = 0;
    let max_consecutive_errors = 5;
    let mut iterations = 0;
    let mut target_depth_reached = false;
    
    let analysis_start = Instant::now();
    
    // Set much more aggressive timeouts and depth limits for responsiveness
    let (max_analysis_time, target_depth, early_stop_enabled) = match go_mode {
        GoMode::Infinite => (Duration::from_millis(2000), Some(12u32), true), // 2 seconds max, depth 12
        GoMode::Time(ms) => (Duration::from_millis(ms as u64 + 500), None, false), // time + 500ms buffer  
        GoMode::Depth(depth) => {
            // For depth mode, set very aggressive time limits based on requested depth
            let time_limit = match depth {
                1..=3 => Duration::from_millis(500),   // 0.5 seconds for very shallow
                4..=8 => Duration::from_millis(1500),  // 1.5 seconds for shallow
                9..=15 => Duration::from_millis(3000), // 3 seconds for medium
                _ => Duration::from_millis(5000),      // 5 seconds for deep
            };
            (time_limit, Some(depth), true)
        },
        GoMode::Nodes(_) => (Duration::from_secs(10), None, false), // 10 seconds max for nodes mode  
        GoMode::PlayersTime(_) => (Duration::from_secs(15), None, false), // 15 seconds max for players time
    };
    
    debug!("Starting analysis loop with mode: {:?}, max_time: {:?}, target_depth: {:?}, early_stop: {}", 
           go_mode, max_analysis_time, target_depth, early_stop_enabled);
    
    loop {
        iterations += 1;
        
        // Safety check to prevent infinite loops - much more aggressive for depth mode
        let max_iterations = if early_stop_enabled { 200 } else { 1000 };
        if iterations > max_iterations {
            warn!("Maximum iterations ({}) reached, forcing termination", max_iterations);
            break;
        }
        
        // Check termination condition more frequently for better responsiveness
        if iterations % 3 == 0 {  // Check every 3 iterations instead of 5
            let process_guard = process_arc.lock().await;
            if process_guard.should_terminate() {
                debug!("Analysis loop terminating due to engine state");
                break;
            }
        }
        
        // Check for analysis timeout (especially important for depth mode)
        if analysis_start.elapsed() > max_analysis_time {
            warn!("Analysis timeout reached after {:?}, stopping engine (requested_depth: {:?}, max_engine_depth_seen: {})", 
                   analysis_start.elapsed(), target_depth, max_depth_reached);
            
            // Process any remaining messages before stopping
            if !pending_info_messages.is_empty() {
                let mut process_guard = process_arc.lock().await;
                if let Err(e) = handle_batched_info_messages(
                    &mut pending_info_messages, 
                    &mut process_guard, 
                    &id_str, 
                    &tab_str, 
                    app
                ).await {
                    warn!("Error handling final batched messages: {:?}", e);
                }
            }
            
            let mut process_guard = process_arc.lock().await;
            let _ = process_guard.stop().await;
            // Give it a moment to process the stop command
            sleep(Duration::from_millis(50)).await; // Reduced from 100ms
            debug!("Engine stopped due to timeout");
            break;
        }
        
        // For depth searches, check if we've reached target depth and should stop early
        if early_stop_enabled && !target_depth_reached {
            if let Some(target) = target_depth {
                if max_depth_reached >= target {
                    debug!("Target depth {} reached (current max: {}), stopping analysis early", 
                           target, max_depth_reached);
                    target_depth_reached = true;
                    
                    // Process pending messages before stopping
                    if !pending_info_messages.is_empty() {
                        let mut process_guard = process_arc.lock().await;
                        if let Err(e) = handle_batched_info_messages(
                            &mut pending_info_messages, 
                            &mut process_guard, 
                            &id_str, 
                            &tab_str, 
                            app
                        ).await {
                            warn!("Error handling messages before depth stop: {:?}", e);
                        }
                    }
                    
                    let mut process_guard = process_arc.lock().await;
                    if let Err(e) = process_guard.stop().await {
                        warn!("Error stopping engine at target depth: {:?}", e);
                    } else {
                        debug!("Successfully sent stop command at depth {}", target);
                    }
                    // The engine should send BestMove soon, which will exit the loop
                }
            }
        }
        
        // Use more reasonable timeout - longer for depth mode since we want complete info
        let line_timeout = if early_stop_enabled { 
            Duration::from_millis(100) // Faster for depth searches
        } else { 
            Duration::from_millis(200) // Standard for time-based searches
        };
        
        let line_result = timeout(line_timeout, reader.next_line()).await;
        
        match line_result {
            Ok(Ok(Some(line))) => {
                consecutive_errors = 0;
                
                match parse_one(&line) {
                    UciMessage::Info(attrs) => {
                        // Parse without reconstructing position
                        if let Ok(Some(best_moves)) = parse_uci_attrs_optimized(attrs, &cached_position) {
                            debug!("Received info with depth {}, multipv {} (requested depth: {:?})", 
                                   best_moves.depth, best_moves.multipv, target_depth);
                            max_depth_reached = max_depth_reached.max(best_moves.depth);
                            pending_info_messages.push(best_moves);
                        }
                    }
                    UciMessage::BestMove { .. } => {
                        debug!("Received BestMove message, pending_messages: {}", pending_info_messages.len());
                        
                        // Handle all pending messages and finalize
                        if !pending_info_messages.is_empty() {
                            let mut process_guard = process_arc.lock().await;
                            process_guard.mark_activity();
                            
                            if let Err(e) = handle_batched_info_messages(
                                &mut pending_info_messages, 
                                &mut process_guard, 
                                &id_str, 
                                &tab_str, 
                                app
                            ).await {
                                warn!("Error handling batched info messages: {:?}", e);
                            }
                        }
                        
                        let process_guard = process_arc.lock().await;
                        if let Err(e) = handle_best_move_message(&process_guard, &id_str, &tab_str, app).await {
                            warn!("Error handling best move: {:?}", e);
                        } else {
                            debug!("Successfully handled BestMove message");
                        }
                        debug!("Received BestMove, analysis complete");
                        break; // Analysis complete
                    }
                    _ => {} // Ignore other UCI messages
                }
                
                log_buffer.push(EngineLog::Engine(line));
                
                // More aggressive batching for depth searches to reduce processing overhead
                let batch_threshold = if early_stop_enabled { 2 } else { 3 };
                let log_threshold = if early_stop_enabled { 3 } else { 5 };
                let periodic_check = if early_stop_enabled { 10 } else { 20 };
                
                if pending_info_messages.len() >= batch_threshold || 
                   log_buffer.len() >= log_threshold || 
                   iterations % periodic_check == 0 {
                    let mut process_guard = process_arc.lock().await;
                    process_guard.mark_activity();
                    
                    // Add logs in batch
                    process_guard.logs.extend(log_buffer.drain(..));
                    
                    if !pending_info_messages.is_empty() {
                        if let Err(e) = handle_batched_info_messages(
                            &mut pending_info_messages, 
                            &mut process_guard, 
                            &id_str, 
                            &tab_str, 
                            app
                        ).await {
                            warn!("Error handling batched info messages: {:?}", e);
                        }
                    }
                }
            }
            Ok(Ok(None)) => {
                // Engine closed stdout
                warn!("Engine stdout closed unexpectedly");
                break;
            }
            Ok(Err(e)) => {
                consecutive_errors += 1;
                error!("Error reading from engine: {:?}", e);
                
                if consecutive_errors >= max_consecutive_errors {
                    return Err(Error::EngineCommunication(
                        format!("Too many consecutive read errors: {}", e)
                    ));
                }
            }
            Err(_) => {
                // Timeout - just continue, we check other conditions above
                continue;
            }
        }
    }
    
    // Final cleanup: process any remaining messages and emit final update
    if !pending_info_messages.is_empty() || !log_buffer.is_empty() {
        debug!("Processing final {} pending messages and {} logs", pending_info_messages.len(), log_buffer.len());
        let mut process_guard = process_arc.lock().await;
        
        // Add any remaining logs
        process_guard.logs.extend(log_buffer.drain(..));
        
        // Process final messages
        if !pending_info_messages.is_empty() {
            if let Err(e) = handle_batched_info_messages(
                &mut pending_info_messages, 
                &mut process_guard, 
                &id_str, 
                &tab_str, 
                app
            ).await {
                warn!("Error handling final info messages: {:?}", e);
            }
        }
        
        // Emit final completion message if we have any results
        if !process_guard.last_best_moves.is_empty() {
            if let Err(e) = handle_best_move_message(&process_guard, &id_str, &tab_str, app).await {
                warn!("Error emitting final best move: {:?}", e);
            } else {
                debug!("Emitted final results with {} lines", process_guard.last_best_moves.len());
            }
        }
    }
    
    debug!("Analysis loop completed after {} iterations in {:?}", iterations, analysis_start.elapsed());
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

/// Optimized batched handling of info messages to reduce mutex contention
async fn handle_batched_info_messages(
    pending_messages: &mut Vec<BestMoves>,
    process: &mut EngineProcess,
    id: &str,
    tab: &str,
    app: &tauri::AppHandle,
) -> Result<(), Error> {
    if pending_messages.is_empty() {
        return Ok(());
    }
    
    debug!("Processing {} batched messages", pending_messages.len());
    
    // Sort by MultiPV to ensure correct order
    pending_messages.sort_by_key(|bm| bm.multipv);
    
    let mut current_depth = 0;
    let mut processed_any = false;
    
    for best_moves in pending_messages.drain(..) {
        let multipv = best_moves.multipv;
        current_depth = best_moves.depth;
        
        // Always accept valid moves, even if out of sequence (for robustness)
        if multipv > 0 && multipv <= process.real_multipv {
            // Reset if we're starting a new depth
            if current_depth > process.last_depth {
                process.best_moves.clear();
            }
            
            // Add this move if we don't already have it for this multipv
            if let Some(existing_pos) = process.best_moves.iter().position(|bm| bm.multipv == multipv) {
                process.best_moves[existing_pos] = best_moves;
            } else {
                process.best_moves.push(best_moves);
            }
            
            processed_any = true;
            
            // Check if we have all lines for this depth
            let mut have_all_lines = true;
            for expected_pv in 1..=process.real_multipv {
                if !process.best_moves.iter().any(|bm| bm.multipv == expected_pv && bm.depth == current_depth) {
                    have_all_lines = false;
                    break;
                }
            }
            
            if have_all_lines && should_emit_progress_update(process, current_depth)? {
                debug!("Emitting progress update for depth {} with {} lines", current_depth, process.best_moves.len());
                emit_progress_update(process, id, tab, app, current_depth).await?;
                // Don't clear here - keep for final emission
            }
        }
    }
    
    if processed_any {
        debug!("Processed batched messages, current depth: {}, moves: {}", current_depth, process.best_moves.len());
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
    
    debug!("Emitting progress update: depth={}, lines={}, progress={:.1}%", 
           current_depth, process.best_moves.len(), progress);
    
    payload.emit(app)?;
    
    // Update process state - keep the moves for final emission
    process.last_depth = current_depth;
    process.last_best_moves = process.best_moves.clone(); // Clone instead of move
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
    debug!("Getting engine config for: {}", path.display());
    
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
            warn!("Engine config timeout for path: {:?}", path);
            config.name = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Engine")
                .to_string();
            break;
        }

        match timeout(Duration::from_millis(100), stdout.next_line()).await {
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
                warn!("Engine closed stdout during config retrieval: {}", path.display());
                break;
            }
            Ok(Err(e)) => {
                // Error reading from stdout
                warn!("Error reading from engine stdout: {}", e);
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
