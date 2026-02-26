use std::path::{Path, PathBuf};

use anyhow::{Context, Result};

const SERVICE_TEMPLATE: &str =
    include_str!("../../../resources/lumo-daemon.service.template");

pub fn log_dir(home_dir: &Path) -> PathBuf {
    home_dir.join(".lumo/logs")
}

pub fn daemon_binary_name() -> &'static str {
    "lumo-daemon"
}

pub fn service_config_path(home_dir: &Path) -> PathBuf {
    home_dir.join(".config/systemd/user/lumo-daemon.service")
}

/// Render the systemd service template and write to disk, then reload systemd.
pub fn install_service(
    daemon_path: &Path,
    log_dir: &Path,
    home_dir: &Path,
) -> Result<()> {
    let content = SERVICE_TEMPLATE
        .replace("{{DAEMON_PATH}}", &daemon_path.display().to_string())
        .replace("{{LOG_DIR}}", &log_dir.display().to_string())
        .replace("{{HOME}}", &home_dir.display().to_string());

    let config_path = service_config_path(home_dir);
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    std::fs::write(&config_path, content)
        .context("Failed to write systemd service file")?;

    // Reload systemd user daemon so it picks up the new/updated unit file.
    let status = std::process::Command::new("systemctl")
        .args(["--user", "daemon-reload"])
        .status()
        .context("Failed to run systemctl daemon-reload")?;

    if !status.success() {
        anyhow::bail!("systemctl --user daemon-reload failed");
    }

    Ok(())
}

/// Start and enable the systemd user service.
pub async fn start_service(_service_path: &Path) -> Result<()> {
    let output = tokio::process::Command::new("systemctl")
        .args(["--user", "enable", "--now", "lumo-daemon"])
        .output()
        .await
        .context("Failed to run systemctl start")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("systemctl --user enable --now lumo-daemon failed: {}", stderr);
    }
    Ok(())
}

/// Stop the systemd user service.
pub async fn stop_service(_service_path: &Path) -> Result<()> {
    let _ = tokio::process::Command::new("systemctl")
        .args(["--user", "stop", "lumo-daemon"])
        .output()
        .await;
    // Give the service a moment to stop.
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    Ok(())
}
