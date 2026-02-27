mod health;
mod manager;
#[cfg(target_os = "macos")]
mod plist;

pub use health::{check_daemon_health, daemon_http_endpoint};
pub use manager::DaemonManager;
