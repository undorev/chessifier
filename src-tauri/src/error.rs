use shakmaty::Chess;
use specta::Type;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Zip(#[from] zip::result::ZipError),

    #[error(transparent)]
    BincodeEncode(#[from] bincode::error::EncodeError),

    #[error(transparent)]
    BincodeDecode(#[from] bincode::error::DecodeError),

    #[error(transparent)]
    XmlDeserialize(#[from] quick_xml::de::DeError),

    #[error(transparent)]
    ParseInt(#[from] std::num::ParseIntError),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    TauriShell(#[from] tauri_plugin_shell::Error),

    #[error(transparent)]
    TauriOpener(#[from] tauri_plugin_opener::Error),

    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),

    #[error(transparent)]
    ChessPosition(#[from] shakmaty::PositionError<Chess>),

    #[error(transparent)]
    IllegalUciMove(#[from] shakmaty::uci::IllegalUciMoveError),

    #[error(transparent)]
    ParseUciMove(#[from] shakmaty::uci::ParseUciMoveError),

    #[error(transparent)]
    Fen(#[from] shakmaty::fen::ParseFenError),

    #[error(transparent)]
    ParseSan(#[from] shakmaty::san::ParseSanError),

    #[error(transparent)]
    IllegalSan(#[from] shakmaty::san::SanError),

    #[error(transparent)]
    Diesel(#[from] diesel::result::Error),

    #[error(transparent)]
    DieselConnection(#[from] diesel::ConnectionError),

    #[error(transparent)]
    R2d2(#[from] diesel::r2d2::PoolError),

    #[error(transparent)]
    SystemTime(#[from] std::time::SystemTimeError),

    #[error(transparent)]
    FromUtf8Error(#[from] std::string::FromUtf8Error),

    #[error(transparent)]
    FormatError(#[from] std::fmt::Error),

    #[error("No stdin")]
    NoStdin,

    #[error("No stdout")]
    NoStdout,

    #[error("No moves found")]
    NoMovesFound,

    #[error("Search stopped")]
    SearchStopped,

    #[error("Missing reference database")]
    MissingReferenceDatabase,

    #[error("No opening found")]
    NoOpeningFound,

    #[error("No match found")]
    NoMatchFound,

    #[error("No puzzles")]
    NoPuzzles,

    #[error("Cannot merge players: they are distinct players who have played against each other")]
    NotDistinctPlayers,

    #[error("Invalid binary data")]
    InvalidBinaryData,

    #[error("Failed to acquire mutex lock: {0}")]
    MutexLockFailed(String),

    #[error("Package manager error: {0}")]
    PackageManager(String),

    #[error("Invalid MultiPV value: {0}")]
    InvalidMultiPvValue(String),

    #[error("Engine timeout: {0}")]
    EngineTimeout(String),

    #[error("Engine crashed: {0}")]
    EngineCrashed(String),

    #[error("Engine unresponsive")]
    EngineUnresponsive,

    #[error("Hash allocation failed: {0}")]
    HashAllocationFailed(String),

    #[error("Invalid engine state: {0}")]
    InvalidEngineState(String),

    #[error("Engine communication error: {0}")]
    EngineCommunication(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl Type for Error {
    fn inline(
        _type_map: &mut specta::TypeMap,
        _generics: specta::Generics,
    ) -> specta::datatype::DataType {
        specta::datatype::DataType::Primitive(specta::datatype::PrimitiveType::String)
    }
}

impl Clone for Error {
    fn clone(&self) -> Self {
        match self {
            Error::NoStdin => Error::NoStdin,
            Error::NoStdout => Error::NoStdout,
            Error::NoMovesFound => Error::NoMovesFound,
            Error::SearchStopped => Error::SearchStopped,
            Error::MissingReferenceDatabase => Error::MissingReferenceDatabase,
            Error::NoOpeningFound => Error::NoOpeningFound,
            Error::NoMatchFound => Error::NoMatchFound,
            Error::NoPuzzles => Error::NoPuzzles,
            Error::NotDistinctPlayers => Error::NotDistinctPlayers,
            Error::InvalidBinaryData => Error::InvalidBinaryData,
            Error::MutexLockFailed(msg) => Error::MutexLockFailed(msg.clone()),
            Error::PackageManager(msg) => Error::PackageManager(msg.clone()),
            Error::InvalidMultiPvValue(msg) => Error::InvalidMultiPvValue(msg.clone()),
            Error::EngineTimeout(msg) => Error::EngineTimeout(msg.clone()),
            Error::EngineCrashed(msg) => Error::EngineCrashed(msg.clone()),
            Error::EngineUnresponsive => Error::EngineUnresponsive,
            Error::HashAllocationFailed(msg) => Error::HashAllocationFailed(msg.clone()),
            Error::InvalidEngineState(msg) => Error::InvalidEngineState(msg.clone()),
            Error::EngineCommunication(msg) => Error::EngineCommunication(msg.clone()),
            // For complex error types that can't be cloned easily, create a generic error
            Error::Io(_) => Error::EngineCommunication("IO Error".to_string()),
            Error::Zip(_) => Error::EngineCommunication("Zip Error".to_string()),
            Error::BincodeEncode(_) => Error::EngineCommunication("Encode Error".to_string()),
            Error::BincodeDecode(_) => Error::EngineCommunication("Decode Error".to_string()),
            Error::XmlDeserialize(_) => Error::EngineCommunication("XML Error".to_string()),
            Error::ParseInt(_) => Error::InvalidMultiPvValue("Parse Error".to_string()),
            Error::Tauri(_) => Error::EngineCommunication("Tauri Error".to_string()),
            Error::TauriShell(_) => Error::EngineCommunication("Shell Error".to_string()),
            Error::TauriOpener(_) => Error::EngineCommunication("Opener Error".to_string()),
            Error::Reqwest(_) => Error::EngineCommunication("Network Error".to_string()),
            Error::ChessPosition(_) => Error::InvalidEngineState("Invalid Position".to_string()),
            Error::IllegalUciMove(_) => Error::InvalidEngineState("Illegal Move".to_string()),
            Error::ParseUciMove(_) => Error::InvalidEngineState("Parse Move Error".to_string()),
            Error::Fen(_) => Error::InvalidEngineState("FEN Error".to_string()),
            Error::ParseSan(_) => Error::InvalidEngineState("SAN Error".to_string()),
            Error::IllegalSan(_) => Error::InvalidEngineState("Illegal SAN".to_string()),
            Error::Diesel(_) => Error::EngineCommunication("Database Error".to_string()),
            Error::DieselConnection(_) => Error::EngineCommunication("DB Connection Error".to_string()),
            Error::R2d2(_) => Error::EngineCommunication("Connection Pool Error".to_string()),
            Error::SystemTime(_) => Error::EngineTimeout("System Time Error".to_string()),
            Error::FromUtf8Error(_) => Error::EngineCommunication("UTF8 Error".to_string()),
            Error::FormatError(_) => Error::EngineCommunication("Format Error".to_string()),
        }
    }
}

pub type Result<T> = std::result::Result<T, Error>;