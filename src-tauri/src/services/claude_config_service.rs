//! Claude Code configuration service
//!
//! Manages Claude settings files to configure OTEL telemetry export
//! and hooks forwarding to the Lumo daemon.

use anyhow::{Context, Result};
use serde_json::{json, Map, Value};
use std::fs;
use std::path::{Path, PathBuf};

#[cfg(target_os = "windows")]
use super::WslRuntimeService;

/// Static OTEL environment variables that Lumo manages.
const OTEL_STATIC_ENV_VARS: &[(&str, &str)] = &[
    ("CLAUDE_CODE_ENABLE_TELEMETRY", "1"),
    ("OTEL_METRICS_EXPORTER", "otlp"),
    ("OTEL_LOGS_EXPORTER", "otlp"),
    ("OTEL_EXPORTER_OTLP_PROTOCOL", "http/json"),
];

/// The command used by Lumo hooks — pipes hook stdin JSON to the daemon.
/// Uses --noproxy to bypass any system proxy (for localhost delivery).
const HOOK_COMMAND: &str =
    "curl -s --noproxy localhost -X POST http://localhost:4318/notify -H 'Content-Type: application/json' -d \"$(cat)\"";

/// Marker substring to detect if a Lumo hook is already present.
const HOOK_MARKER: &str = "localhost:4318/notify";

/// Hook events that Lumo subscribes to.
const HOOK_EVENTS: &[&str] = &["Notification", "Stop", "SubagentStop"];

#[derive(Debug, Clone)]
struct SettingsTarget {
    label: &'static str,
    path: PathBuf,
    optional: bool,
}

pub struct ClaudeConfigService;

impl ClaudeConfigService {
    fn local_settings_path() -> Result<PathBuf> {
        let home = dirs::home_dir().context("Could not find home directory")?;
        Ok(home.join(".claude").join("settings.json"))
    }

    fn settings_targets() -> Result<Vec<SettingsTarget>> {
        let local_path = Self::local_settings_path()?;
        #[cfg(target_os = "windows")]
        let mut targets = vec![SettingsTarget {
            label: "local",
            path: local_path.clone(),
            optional: false,
        }];
        #[cfg(not(target_os = "windows"))]
        let targets = vec![SettingsTarget {
            label: "local",
            path: local_path.clone(),
            optional: false,
        }];

        #[cfg(target_os = "windows")]
        {
            if let Some(wsl_path) = WslRuntimeService::default_settings_path() {
                if wsl_path != local_path {
                    targets.push(SettingsTarget {
                        label: "wsl-default",
                        path: wsl_path,
                        optional: true,
                    });
                }
            }
        }

        Ok(targets)
    }

    fn read_settings(path: &Path) -> Result<Map<String, Value>> {
        if path.exists() {
            let content = fs::read_to_string(path)
                .with_context(|| format!("Failed to read Claude settings: {}", path.display()))?;
            serde_json::from_str(&content)
                .with_context(|| format!("Failed to parse Claude settings: {}", path.display()))
        } else {
            Ok(Map::new())
        }
    }

    fn write_settings(path: &Path, root: &Map<String, Value>) -> Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).with_context(|| {
                format!(
                    "Failed to create Claude settings directory: {}",
                    parent.display()
                )
            })?;
        }

        let content =
            serde_json::to_string_pretty(root).context("Failed to serialize Claude settings")?;
        fs::write(path, content)
            .with_context(|| format!("Failed to write Claude settings: {}", path.display()))?;
        Ok(())
    }

    fn daemon_endpoint() -> String {
        std::env::var("LUMO_SERVER_ADDRESS")
            .map(|addr| format!("http://{}", addr))
            .unwrap_or_else(|_| "http://localhost:4318".to_string())
    }

    /// Ensure Claude settings have required OTEL env vars for all supported targets.
    pub fn ensure_otel_config() -> Result<()> {
        let mut updated_any = false;

        for target in Self::settings_targets()? {
            match Self::ensure_otel_config_for_path(&target.path) {
                Ok(updated) => {
                    if updated {
                        updated_any = true;
                        log::info!(
                            "Updated Claude Code OTEL config at {} ({})",
                            target.path.display(),
                            target.label
                        );
                    }
                }
                Err(e) if target.optional => {
                    log::warn!(
                        "Skipping optional Claude settings target {} ({}): {}",
                        target.path.display(),
                        target.label,
                        e
                    );
                }
                Err(e) => return Err(e),
            }
        }

        if !updated_any {
            log::info!("Claude Code OTEL config already up to date");
        }

        Ok(())
    }

    fn ensure_otel_config_for_path(path: &Path) -> Result<bool> {
        let mut root = Self::read_settings(path)?;

        let env_obj = root
            .entry("env")
            .or_insert_with(|| Value::Object(Map::new()));
        let env_map = env_obj
            .as_object_mut()
            .context("'env' field in Claude settings is not an object")?;

        let mut changed = false;

        for &(key, value) in OTEL_STATIC_ENV_VARS {
            let expected = Value::String(value.to_string());
            if env_map.get(key) != Some(&expected) {
                env_map.insert(key.to_string(), expected);
                changed = true;
            }
        }

        let endpoint_key = "OTEL_EXPORTER_OTLP_ENDPOINT";
        let endpoint_expected = Value::String(Self::daemon_endpoint());
        if env_map.get(endpoint_key) != Some(&endpoint_expected) {
            env_map.insert(endpoint_key.to_string(), endpoint_expected);
            changed = true;
        }

        if changed {
            Self::write_settings(path, &root)?;
        }

        Ok(changed)
    }

    /// Check if a JSON value (at any nesting level) contains the Lumo hook marker.
    fn contains_hook_marker(value: &Value) -> bool {
        match value {
            Value::String(s) => s.contains(HOOK_MARKER),
            Value::Array(arr) => arr.iter().any(Self::contains_hook_marker),
            Value::Object(map) => map.values().any(Self::contains_hook_marker),
            _ => false,
        }
    }

    /// Ensure Claude settings have hooks that forward events to `/notify`.
    pub fn ensure_hooks_config() -> Result<()> {
        let mut updated_any = false;

        for target in Self::settings_targets()? {
            match Self::ensure_hooks_config_for_path(&target.path) {
                Ok(updated) => {
                    if updated {
                        updated_any = true;
                        log::info!(
                            "Updated Claude Code hooks config at {} ({})",
                            target.path.display(),
                            target.label
                        );
                    }
                }
                Err(e) if target.optional => {
                    log::warn!(
                        "Skipping optional Claude settings hooks target {} ({}): {}",
                        target.path.display(),
                        target.label,
                        e
                    );
                }
                Err(e) => return Err(e),
            }
        }

        if !updated_any {
            log::info!("Claude Code hooks config already up to date");
        }

        Ok(())
    }

    fn ensure_hooks_config_for_path(path: &Path) -> Result<bool> {
        let mut root = Self::read_settings(path)?;

        let hooks_obj = root
            .entry("hooks")
            .or_insert_with(|| Value::Object(Map::new()));
        let hooks_map = hooks_obj
            .as_object_mut()
            .context("'hooks' field in Claude settings is not an object")?;

        let expected_hook = json!({
            "hooks": [
                {
                    "type": "command",
                    "command": HOOK_COMMAND,
                }
            ]
        });

        let mut changed = false;

        for &event_name in HOOK_EVENTS {
            let event_arr = hooks_map
                .entry(event_name)
                .or_insert_with(|| Value::Array(Vec::new()));
            let arr = event_arr
                .as_array_mut()
                .with_context(|| format!("hooks.{} is not an array", event_name))?;

            if arr.contains(&expected_hook) {
                continue;
            }

            arr.retain(|entry| !Self::contains_hook_marker(entry));
            arr.push(expected_hook.clone());
            changed = true;
        }

        if changed {
            Self::write_settings(path, &root)?;
        }

        Ok(changed)
    }
}
