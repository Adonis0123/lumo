use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Context, Result};

const PLIST_TEMPLATE: &str =
    include_str!("../../../resources/com.lumo.daemon.plist.template");

pub fn log_dir(home_dir: &Path) -> PathBuf {
    home_dir.join("Library/Logs/com.lumo.daemon")
}

pub fn daemon_binary_name() -> &'static str {
    "lumo-daemon"
}

pub fn service_config_path(home_dir: &Path) -> PathBuf {
    home_dir.join("Library/LaunchAgents/com.lumo.daemon.plist")
}

/// Render the plist template with actual paths and write to disk.
pub fn install_service(
    daemon_path: &Path,
    log_dir: &Path,
    home_dir: &Path,
) -> Result<()> {
    let content = PLIST_TEMPLATE
        .replace("{{DAEMON_PATH}}", &daemon_path.display().to_string())
        .replace("{{LOG_DIR}}", &log_dir.display().to_string())
        .replace("{{HOME}}", &home_dir.display().to_string());

    let config_path = service_config_path(home_dir);
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    std::fs::write(&config_path, content)
        .context("Failed to write launchd plist")?;
    Ok(())
}

/// Load the launchd service.
pub async fn start_service(service_path: &Path) -> Result<()> {
    let output = tokio::process::Command::new("launchctl")
        .args(["load", &service_path.display().to_string()])
        .output()
        .await
        .context("Failed to run launchctl load")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("launchctl load failed: {}", stderr);
    }
    Ok(())
}

/// Unload the launchd service. Ignores errors (service may not be loaded).
pub async fn stop_service(service_path: &Path) -> Result<()> {
    let _ = tokio::process::Command::new("launchctl")
        .args(["unload", &service_path.display().to_string()])
        .output()
        .await;
    tokio::time::sleep(Duration::from_millis(500)).await;
    Ok(())
}
