//! WSL runtime detection and path helpers.
//!
//! On Windows, this module discovers the default WSL distro and exposes
//! host-accessible UNC paths for Claude settings/session files.

use std::path::PathBuf;

#[derive(Debug, Clone, Default)]
pub struct WslRuntimeStatus {
    pub detected: bool,
    pub default_distro: Option<String>,
    pub settings_path: Option<PathBuf>,
    pub sessions_path: Option<PathBuf>,
    pub settings_writable: bool,
    pub sessions_readable: bool,
}

pub struct WslRuntimeService;

impl WslRuntimeService {
    /// Get default WSL distro name if WSL is available.
    #[cfg(target_os = "windows")]
    pub fn default_distro() -> Option<String> {
        if let Some(name) = Self::default_distro_from_verbose() {
            return Some(name);
        }
        Self::default_distro_from_quiet()
    }

    /// Resolve default WSL `~/.claude/settings.json` as a host UNC path.
    #[cfg(target_os = "windows")]
    pub fn default_settings_path() -> Option<PathBuf> {
        let distro = Self::default_distro()?;
        let home = Self::distro_home(&distro)?;
        Some(Self::linux_path_to_unc_with_distro(
            &distro,
            &format!("{}/.claude/settings.json", home),
        ))
    }

    /// Resolve default WSL `~/.claude/projects` as a host UNC path.
    #[cfg(target_os = "windows")]
    pub fn default_projects_path() -> Option<PathBuf> {
        let distro = Self::default_distro()?;
        let home = Self::distro_home(&distro)?;
        Some(Self::linux_path_to_unc_with_distro(
            &distro,
            &format!("{}/.claude/projects", home),
        ))
    }

    /// Convert a Linux absolute path in default WSL distro to a UNC path.
    #[cfg(target_os = "windows")]
    pub fn linux_path_to_unc(path: &str) -> Option<PathBuf> {
        if !path.starts_with('/') {
            return None;
        }
        let distro = Self::default_distro()?;
        Some(Self::linux_path_to_unc_with_distro(&distro, path))
    }

    /// Snapshot runtime status for diagnostics.
    pub fn inspect() -> WslRuntimeStatus {
        #[cfg(target_os = "windows")]
        {
            let default_distro = Self::default_distro();
            let settings_path = Self::default_settings_path();
            let sessions_path = Self::default_projects_path();

            let settings_writable = settings_path
                .as_ref()
                .and_then(|p| p.parent())
                .map(|p| p.exists())
                .unwrap_or(false);

            let sessions_readable = sessions_path
                .as_ref()
                .map(|p| p.exists() && p.is_dir())
                .unwrap_or(false);

            return WslRuntimeStatus {
                detected: default_distro.is_some(),
                default_distro,
                settings_path,
                sessions_path,
                settings_writable,
                sessions_readable,
            };
        }

        #[cfg(not(target_os = "windows"))]
        {
            WslRuntimeStatus::default()
        }
    }

    #[cfg(target_os = "windows")]
    fn default_distro_from_verbose() -> Option<String> {
        let output = std::process::Command::new("wsl.exe")
            .args(["-l", "-v"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            let trimmed = line.trim_start().trim_start_matches('\u{feff}');
            if !trimmed.starts_with('*') {
                continue;
            }
            let rest = trimmed.trim_start_matches('*').trim_start();
            if rest.is_empty() {
                continue;
            }
            let distro = rest.split_whitespace().next().map(|s| s.to_string());
            if distro.is_some() {
                return distro;
            }
        }

        None
    }

    #[cfg(target_os = "windows")]
    fn default_distro_from_quiet() -> Option<String> {
        let output = std::process::Command::new("wsl.exe")
            .args(["-l", "-q"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        stdout
            .lines()
            .map(|l| l.trim().trim_start_matches('\u{feff}'))
            .find(|l| !l.is_empty())
            .map(|l| l.to_string())
    }

    #[cfg(target_os = "windows")]
    fn distro_home(distro: &str) -> Option<String> {
        let output = std::process::Command::new("wsl.exe")
            .args(["-d", distro, "--", "sh", "-lc", "printf '%s' \"$HOME\""])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let home = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if home.starts_with('/') {
            Some(home)
        } else {
            None
        }
    }

    #[cfg(target_os = "windows")]
    fn linux_path_to_unc_with_distro(distro: &str, linux_path: &str) -> PathBuf {
        let mut unc = PathBuf::from(format!(r"\\wsl$\{}", distro));
        for part in linux_path
            .trim()
            .trim_start_matches('/')
            .split('/')
            .filter(|part| !part.is_empty())
        {
            unc.push(part);
        }
        unc
    }
}
