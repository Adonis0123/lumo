use tauri::command;

use crate::daemon::{check_daemon_health, daemon_http_endpoint};
use crate::services::WslRuntimeService;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEnvStatus {
    pub platform: String,
    pub daemon_healthy: bool,
    pub daemon_version: Option<String>,
    pub endpoint: String,
    pub wsl_detected: bool,
    pub default_distro: Option<String>,
    pub wsl_settings_writable: bool,
    pub wsl_sessions_readable: bool,
    pub wsl_settings_path: Option<String>,
    pub wsl_sessions_path: Option<String>,
}

#[command]
pub async fn get_daemon_status() -> Result<bool, String> {
    Ok(check_daemon_health().await.is_some())
}

#[command]
pub async fn get_runtime_env_status() -> Result<RuntimeEnvStatus, String> {
    let health = check_daemon_health().await;
    let wsl = WslRuntimeService::inspect();

    Ok(RuntimeEnvStatus {
        platform: std::env::consts::OS.to_string(),
        daemon_healthy: health.is_some(),
        daemon_version: health.map(|h| h.version),
        endpoint: daemon_http_endpoint(),
        wsl_detected: wsl.detected,
        default_distro: wsl.default_distro,
        wsl_settings_writable: wsl.settings_writable,
        wsl_sessions_readable: wsl.sessions_readable,
        wsl_settings_path: wsl
            .settings_path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string()),
        wsl_sessions_path: wsl
            .sessions_path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string()),
    })
}
