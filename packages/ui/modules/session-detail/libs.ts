/**
 * Format date for display
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time
 */
export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get project name from path
 */
export function getProjectName(projectPath: string): string {
  const parts = projectPath.split("/");
  return parts[parts.length - 1] || projectPath;
}

/**
 * Get a short session ID
 */
export function getShortId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

/**
 * Format message time
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: string | undefined): string {
  if (!model) return "";

  // claude-opus-4-5-20251101 -> Claude Opus 4.5
  // claude-sonnet-4-20250514 -> Claude Sonnet 4
  const parts = model.split("-");
  if (parts[0] === "claude" && parts.length >= 3) {
    const name = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const version = parts[2];
    // Check if version has a dot version (like 4-5 for 4.5)
    if (parts[3] && !isNaN(Number(parts[3]))) {
      return `${name} ${version}.${parts[3]}`;
    }
    return `${name} ${version}`;
  }

  return model;
}
