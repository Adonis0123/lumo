import { invoke } from "@tauri-apps/api/core";
import type {
  ClaudeSession,
  ClaudeSessionDetail,
} from "../generated/typeshare-types";

/**
 * Claude Session Bridge - Frontend interface for Claude Code session operations
 */
export class ClaudeSessionBridge {
  /**
   * Get all Claude Code sessions across all projects
   */
  static async getAllSessions(): Promise<ClaudeSession[]> {
    return invoke<ClaudeSession[]>("get_claude_sessions");
  }

  /**
   * Get Claude Code sessions for a specific project
   */
  static async getSessionsForProject(
    projectPath: string
  ): Promise<ClaudeSession[]> {
    return invoke<ClaudeSession[]>("get_claude_sessions_for_project", {
      projectPath,
    });
  }

  /**
   * Get Claude Code session detail with messages
   */
  static async getSessionDetail(
    sessionPath: string
  ): Promise<ClaudeSessionDetail> {
    return invoke<ClaudeSessionDetail>("get_claude_session_detail", {
      sessionPath,
    });
  }
}
