//! Claude session service
//!
//! Service for reading and parsing Claude Code session data from ~/.claude folder.

use anyhow::{Context, Result};
use std::fs;
use std::path::PathBuf;

use crate::types::{
    ClaudeMessage, ClaudeSession, ClaudeSessionDetail, ClaudeSessionIndex, ClaudeToolUse,
    RawClaudeMessage,
};

/// Service for Claude Code session operations
pub struct ClaudeSessionService;

impl ClaudeSessionService {
    /// Get the path to the .claude directory
    fn get_claude_dir() -> Result<PathBuf> {
        let home = dirs::home_dir().context("Failed to get home directory")?;
        Ok(home.join(".claude"))
    }

    /// Get the path to the projects directory
    fn get_projects_dir() -> Result<PathBuf> {
        Ok(Self::get_claude_dir()?.join("projects"))
    }

    /// Convert a project path to its .claude folder name format
    /// e.g., "/Users/zhnd/dev/projects/lumo" -> "-Users-zhnd-dev-projects-lumo"
    fn project_path_to_folder_name(project_path: &str) -> String {
        project_path.replace('/', "-")
    }

    /// Get all sessions for a specific project
    pub fn get_sessions_for_project(project_path: &str) -> Result<Vec<ClaudeSession>> {
        let projects_dir = Self::get_projects_dir()?;
        let folder_name = Self::project_path_to_folder_name(project_path);
        let project_dir = projects_dir.join(&folder_name);

        if !project_dir.exists() {
            return Ok(vec![]);
        }

        let index_path = project_dir.join("sessions-index.json");
        if !index_path.exists() {
            return Ok(vec![]);
        }

        let content = fs::read_to_string(&index_path)
            .with_context(|| format!("Failed to read sessions index: {:?}", index_path))?;

        let index: ClaudeSessionIndex =
            serde_json::from_str(&content).with_context(|| "Failed to parse sessions index")?;

        let mut sessions: Vec<ClaudeSession> = index
            .entries
            .into_iter()
            .filter(|e| !e.is_sidechain) // Filter out sidechain sessions
            .map(ClaudeSession::from)
            .collect();

        // Sort by modified date (newest first)
        sessions.sort_by(|a, b| b.modified.cmp(&a.modified));

        Ok(sessions)
    }

    /// Get all sessions across all projects
    pub fn get_all_sessions() -> Result<Vec<ClaudeSession>> {
        let projects_dir = Self::get_projects_dir()?;

        if !projects_dir.exists() {
            return Ok(vec![]);
        }

        let mut all_sessions = Vec::new();

        for entry in fs::read_dir(&projects_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let index_path = path.join("sessions-index.json");
                if index_path.exists() {
                    if let Ok(content) = fs::read_to_string(&index_path) {
                        if let Ok(index) = serde_json::from_str::<ClaudeSessionIndex>(&content) {
                            let sessions: Vec<ClaudeSession> = index
                                .entries
                                .into_iter()
                                .filter(|e| !e.is_sidechain)
                                .map(ClaudeSession::from)
                                .collect();
                            all_sessions.extend(sessions);
                        }
                    }
                }
            }
        }

        // Sort by modified date (newest first)
        all_sessions.sort_by(|a, b| b.modified.cmp(&a.modified));

        Ok(all_sessions)
    }

    /// Get session detail including messages
    pub fn get_session_detail(session_path: &str) -> Result<ClaudeSessionDetail> {
        let path = PathBuf::from(session_path);

        if !path.exists() {
            anyhow::bail!("Session file not found: {}", session_path);
        }

        // First, find the session in the index
        let parent = path.parent().context("Invalid session path")?;
        let index_path = parent.join("sessions-index.json");

        let session = if index_path.exists() {
            let content = fs::read_to_string(&index_path)?;
            let index: ClaudeSessionIndex = serde_json::from_str(&content)?;

            index
                .entries
                .into_iter()
                .find(|e| e.full_path == session_path)
                .map(ClaudeSession::from)
        } else {
            None
        };

        let session = session.unwrap_or_else(|| {
            // Create a minimal session from file metadata
            let file_name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            ClaudeSession {
                session_id: file_name,
                full_path: session_path.to_string(),
                first_prompt: None,
                summary: None,
                message_count: 0,
                created: String::new(),
                modified: String::new(),
                git_branch: None,
                project_path: parent.to_string_lossy().to_string(),
                is_sidechain: false,
            }
        });

        // Read and parse messages
        let content = fs::read_to_string(&path)?;
        let messages = Self::parse_session_messages(&content)?;

        Ok(ClaudeSessionDetail { session, messages })
    }

    /// Parse messages from a session JSONL file
    fn parse_session_messages(content: &str) -> Result<Vec<ClaudeMessage>> {
        let mut messages = Vec::new();

        for line in content.lines() {
            if line.trim().is_empty() {
                continue;
            }

            if let Ok(raw) = serde_json::from_str::<RawClaudeMessage>(line) {
                // Only process user and assistant messages
                if raw.message_type != "user" && raw.message_type != "assistant" {
                    continue;
                }

                let uuid = raw.uuid.unwrap_or_default();
                let timestamp = raw.timestamp.unwrap_or_default();

                // Parse content
                let (text, tool_uses) = if let Some(msg_data) = &raw.message {
                    if let Some(content_value) = &msg_data.content {
                        Self::parse_content(content_value)
                    } else {
                        (None, vec![])
                    }
                } else if let Some(txt) = &raw.content {
                    (Some(txt.clone()), vec![])
                } else {
                    (None, vec![])
                };

                // Get model from message data
                let model = raw.message.as_ref().and_then(|m| m.model.clone());

                // Skip messages without content
                if text.is_none() && tool_uses.is_empty() {
                    continue;
                }

                messages.push(ClaudeMessage {
                    uuid,
                    message_type: raw.message_type,
                    timestamp,
                    text,
                    tool_uses,
                    model,
                });
            }
        }

        // Remove duplicate messages (same uuid, keep the last one with most content)
        let mut seen_uuids = std::collections::HashMap::new();
        for (i, msg) in messages.iter().enumerate() {
            seen_uuids.insert(msg.uuid.clone(), i);
        }

        let unique_indices: std::collections::HashSet<usize> =
            seen_uuids.values().cloned().collect();
        messages = messages
            .into_iter()
            .enumerate()
            .filter(|(i, _)| unique_indices.contains(i))
            .map(|(_, m)| m)
            .collect();

        Ok(messages)
    }

    /// Parse content value into text and tool uses
    fn parse_content(value: &serde_json::Value) -> (Option<String>, Vec<ClaudeToolUse>) {
        match value {
            serde_json::Value::String(s) => (Some(s.clone()), vec![]),
            serde_json::Value::Array(arr) => {
                let mut text_parts = Vec::new();
                let mut tool_uses = Vec::new();

                for item in arr {
                    if let Some(obj) = item.as_object() {
                        let block_type = obj.get("type").and_then(|v| v.as_str());

                        match block_type {
                            Some("text") => {
                                if let Some(text) = obj.get("text").and_then(|v| v.as_str()) {
                                    text_parts.push(text.to_string());
                                }
                            }
                            Some("tool_use") => {
                                if let (Some(id), Some(name)) = (
                                    obj.get("id").and_then(|v| v.as_str()),
                                    obj.get("name").and_then(|v| v.as_str()),
                                ) {
                                    let input = obj
                                        .get("input")
                                        .map(|v| serde_json::to_string(v).unwrap_or_default());

                                    tool_uses.push(ClaudeToolUse {
                                        id: id.to_string(),
                                        name: name.to_string(),
                                        input,
                                    });
                                }
                            }
                            _ => {}
                        }
                    }
                }

                let text = if text_parts.is_empty() {
                    None
                } else {
                    Some(text_parts.join("\n"))
                };

                (text, tool_uses)
            }
            _ => (None, vec![]),
        }
    }
}
