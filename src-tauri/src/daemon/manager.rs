use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;

use anyhow::{Context, Result};
use tauri::Manager;

use super::health::check_daemon_health;
#[cfg(target_os = "macos")]
use super::plist;
#[cfg(not(target_os = "macos"))]
use std::fs::OpenOptions;

/// Expected daemon version — read from crates/daemon/Cargo.toml at compile time.
const EXPECTED_VERSION: &str = env!("DAEMON_VERSION");

/// Daemon binary name.
#[cfg(target_os = "windows")]
const DAEMON_BINARY: &str = "lumo-daemon.exe";
/// Daemon binary name.
#[cfg(not(target_os = "windows"))]
const DAEMON_BINARY: &str = "lumo-daemon";
/// Service label.
#[cfg(target_os = "macos")]
const DAEMON_SERVICE_LABEL: &str = "com.lumo.daemon";

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[cfg(target_os = "windows")]
const DAEMON_BINARY_CANDIDATES: &[&str] = &["lumo-daemon.exe", "lumo-daemon"];
#[cfg(not(target_os = "windows"))]
const DAEMON_BINARY_CANDIDATES: &[&str] = &["lumo-daemon", "lumo-daemon.exe"];

pub struct DaemonManager {
    /// ~/.lumo/bin/lumo-daemon(.exe)
    binary_path: PathBuf,
    /// Daemon log directory.
    log_dir: PathBuf,
    /// Runtime directory for pid files, etc.
    run_dir: PathBuf,
    /// User home directory.
    home_dir: PathBuf,
    /// Source binary path (from app bundle or dev target dir).
    source_binary: PathBuf,
    /// launchd plist path.
    #[cfg(target_os = "macos")]
    plist_path: PathBuf,
}

impl DaemonManager {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self> {
        let home_dir = dirs::home_dir().context("Could not determine home directory")?;
        let binary_path = home_dir.join(".lumo/bin").join(DAEMON_BINARY);
        let run_dir = home_dir.join(".lumo/run");
        let log_dir = Self::resolve_log_dir(&home_dir);
        let source_binary = Self::resolve_source_binary(app_handle)?;

        Ok(Self {
            binary_path,
            log_dir,
            run_dir,
            home_dir,
            source_binary,
            #[cfg(target_os = "macos")]
            plist_path: home_dir
                .join("Library/LaunchAgents")
                .join(format!("{}.plist", DAEMON_SERVICE_LABEL)),
        })
    }

    /// Main entry point: ensure the daemon is installed and running with the
    /// correct version.
    pub async fn ensure_running(&self) -> Result<()> {
        // Fast path: daemon is already running with the right version.
        if let Some(health) = check_daemon_health().await {
            if health.version == EXPECTED_VERSION {
                log::info!("Daemon already running (v{})", health.version);
                return Ok(());
            }
            // Version mismatch — upgrade.
            log::warn!(
                "Daemon version mismatch: running={}, expected={}. Upgrading...",
                health.version,
                EXPECTED_VERSION
            );
            return self.upgrade().await;
        }

        // Daemon not responding. Check if binary is installed and executable.
        if self.binary_path.exists() && self.is_executable() {
            // Binary exists but service is not running — try to start.
            log::info!("Daemon binary found but not running. Starting...");
            self.prepare_service_definition()?;
            self.start_service().await?;
            return self.wait_for_health().await;
        }

        // Nothing installed — full install.
        log::info!("Daemon not installed. Installing...");
        self.install().await
    }

    /// Full install: copy binary, create plist, start service.
    async fn install(&self) -> Result<()> {
        self.do_install().await
    }

    /// Upgrade: stop service, replace binary, restart.
    /// If installation fails, attempt to restart the previous service setup.
    async fn upgrade(&self) -> Result<()> {
        self.stop_service().await?;

        if let Err(e) = self.do_install().await {
            log::error!("Upgrade failed, trying to restart previous service: {}", e);
            let _ = self.start_service().await;
            return Err(e);
        }

        Ok(())
    }

    /// Shared install steps: directories, binary, service definition, start, health check.
    async fn do_install(&self) -> Result<()> {
        self.ensure_directories()?;
        self.install_binary()?;
        self.prepare_service_definition()?;
        self.start_service().await?;
        self.wait_for_health().await
    }

    /// Copy daemon binary to ~/.lumo/bin/.
    fn install_binary(&self) -> Result<()> {
        if self.binary_path.exists() {
            let _ = std::fs::remove_file(&self.binary_path);
        }
        std::fs::copy(&self.source_binary, &self.binary_path).with_context(|| {
            format!(
                "Failed to copy {} -> {}",
                self.source_binary.display(),
                self.binary_path.display()
            )
        })?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&self.binary_path, std::fs::Permissions::from_mode(0o755))?;
        }

        log::info!("Installed daemon binary to {}", self.binary_path.display());
        Ok(())
    }

    /// Write (or overwrite) the launchd plist file on macOS.
    #[cfg(target_os = "macos")]
    fn install_plist(&self) -> Result<()> {
        let content = plist::render_plist(&self.binary_path, &self.log_dir, &self.home_dir);

        if let Some(parent) = self.plist_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(&self.plist_path, content).context("Failed to write launchd plist")?;
        Ok(())
    }

    /// Install platform-specific service definition if needed.
    fn prepare_service_definition(&self) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            self.install_plist()?;
        }
        Ok(())
    }

    /// Create required directories.
    fn ensure_directories(&self) -> Result<()> {
        if let Some(parent) = self.binary_path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create daemon bin directory")?;
        }
        std::fs::create_dir_all(&self.log_dir).context("Failed to create daemon log directory")?;
        std::fs::create_dir_all(&self.run_dir).context("Failed to create daemon run directory")?;
        Ok(())
    }

    /// Check if the installed binary has executable permission.
    fn is_executable(&self) -> bool {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::metadata(&self.binary_path)
                .map(|m| m.permissions().mode() & 0o111 != 0)
                .unwrap_or(false)
        }
        #[cfg(not(unix))]
        {
            true
        }
    }

    /// Locate daemon binary: bundled resource (production) or target dir (dev).
    fn resolve_source_binary(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
        // Production: binary bundled as a Tauri resource.
        if let Ok(resource_dir) = app_handle.path().resource_dir() {
            for candidate in DAEMON_BINARY_CANDIDATES {
                let bundled = resource_dir.join(candidate);
                if bundled.exists() {
                    return Ok(bundled);
                }
            }

            // Some bundle layouts keep files under a `resources/` subdirectory.
            for candidate in DAEMON_BINARY_CANDIDATES {
                let bundled_in_subdir = resource_dir.join("resources").join(candidate);
                if bundled_in_subdir.exists() {
                    return Ok(bundled_in_subdir);
                }
            }
        }

        // Dev fallback: workspace target directory.
        let workspace_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("CARGO_MANIFEST_DIR has no parent")
            .to_path_buf();

        for candidate in DAEMON_BINARY_CANDIDATES {
            let release_path = workspace_root.join("target/release").join(candidate);
            if release_path.exists() {
                return Ok(release_path);
            }
            let debug_path = workspace_root.join("target/debug").join(candidate);
            if debug_path.exists() {
                return Ok(debug_path);
            }
        }

        anyhow::bail!("Daemon binary not found. Run `cargo build -p lumo-daemon` first.")
    }

    /// Start daemon service/process for the current platform.
    async fn start_service(&self) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            plist::load_service(&self.plist_path).await?;
            return Ok(());
        }

        #[cfg(not(target_os = "macos"))]
        {
            let stdout_log = OpenOptions::new()
                .create(true)
                .append(true)
                .open(self.log_dir.join("stdout.log"))
                .context("Failed to open daemon stdout log file")?;
            let stderr_log = OpenOptions::new()
                .create(true)
                .append(true)
                .open(self.log_dir.join("stderr.log"))
                .context("Failed to open daemon stderr log file")?;

            let mut cmd = tokio::process::Command::new(&self.binary_path);
            cmd.current_dir(&self.home_dir)
                .env("HOME", &self.home_dir)
                .stdin(Stdio::null())
                .stdout(Stdio::from(stdout_log))
                .stderr(Stdio::from(stderr_log));

            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(CREATE_NO_WINDOW);
            }

            let child = cmd.spawn().context("Failed to spawn daemon process")?;
            if let Some(pid) = child.id() {
                self.write_pid(pid)?;
            }
            // Detach child process by dropping handle.
            drop(child);
        }

        Ok(())
    }

    /// Stop daemon service/process for the current platform.
    async fn stop_service(&self) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            plist::unload_service(&self.plist_path).await?;
        }

        #[cfg(not(target_os = "macos"))]
        {
            if let Some(pid) = self.read_pid() {
                Self::kill_pid(pid).await?;
                self.remove_pid();
            } else {
                Self::kill_by_name(&self.binary_path).await?;
            }
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
        Ok(())
    }

    /// Platform-specific daemon termination by pid.
    #[cfg(unix)]
    async fn kill_pid(pid: u32) -> Result<()> {
        let _ = tokio::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .output()
            .await;
        Ok(())
    }

    /// Fallback process termination by binary name.
    #[cfg(unix)]
    async fn kill_by_name(binary_path: &PathBuf) -> Result<()> {
        let process_name = binary_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("lumo-daemon");

        let _ = tokio::process::Command::new("pkill")
            .args(["-f", process_name])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .output()
            .await;
        Ok(())
    }

    /// Platform-specific daemon termination by pid.
    #[cfg(target_os = "windows")]
    async fn kill_pid(pid: u32) -> Result<()> {
        let _ = tokio::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .output()
            .await;
        Ok(())
    }

    /// Fallback process termination by binary name.
    #[cfg(target_os = "windows")]
    async fn kill_by_name(_binary_path: &PathBuf) -> Result<()> {
        let _ = tokio::process::Command::new("taskkill")
            .args(["/IM", DAEMON_BINARY, "/T", "/F"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .output()
            .await;
        Ok(())
    }

    /// Resolve daemon log directory per platform.
    fn resolve_log_dir(home_dir: &std::path::Path) -> PathBuf {
        #[cfg(target_os = "macos")]
        {
            return home_dir.join("Library/Logs/com.lumo.daemon");
        }
        #[cfg(not(target_os = "macos"))]
        {
            home_dir.join(".lumo/logs/com.lumo.daemon")
        }
    }

    fn pid_file_path(&self) -> PathBuf {
        self.run_dir.join("lumo-daemon.pid")
    }

    fn write_pid(&self, pid: u32) -> Result<()> {
        std::fs::write(self.pid_file_path(), pid.to_string())
            .context("Failed to write daemon pid file")?;
        Ok(())
    }

    fn read_pid(&self) -> Option<u32> {
        let content = std::fs::read_to_string(self.pid_file_path()).ok()?;
        content.trim().parse::<u32>().ok()
    }

    fn remove_pid(&self) {
        let _ = std::fs::remove_file(self.pid_file_path());
    }

    /// Wait for the daemon to become healthy after starting, with retries.
    async fn wait_for_health(&self) -> Result<()> {
        for i in 0..10 {
            tokio::time::sleep(Duration::from_millis(500)).await;
            if let Some(health) = check_daemon_health().await {
                log::info!(
                    "Daemon started successfully (v{}) after {}ms",
                    health.version,
                    (i + 1) * 500
                );
                return Ok(());
            }
        }
        anyhow::bail!("Daemon failed to start within 5 seconds")
    }
}
