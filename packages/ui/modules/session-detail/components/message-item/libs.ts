/** Tags that are purely internal and should be hidden */
const HIDDEN_TAGS = [
  "local-command-caveat",
  "system-reminder",
];

const HIDDEN_PATTERN = new RegExp(
  `<(?:${HIDDEN_TAGS.join("|")})[^>]*>[\\s\\S]*?</(?:${HIDDEN_TAGS.join("|")})>`,
  "g",
);

export interface SlashCommand {
  name: string;
  message: string;
  args: string;
  stdout: string | null;
}

/**
 * Extract slash command info from message text.
 * Returns null if the message doesn't contain a slash command.
 */
export function extractSlashCommand(text: string): SlashCommand | null {
  const nameMatch = text.match(/<command-name>([\s\S]*?)<\/command-name>/);
  if (!nameMatch) return null;

  const messageMatch = text.match(
    /<command-message>([\s\S]*?)<\/command-message>/,
  );
  const argsMatch = text.match(/<command-args>([\s\S]*?)<\/command-args>/);
  const stdoutMatch = text.match(
    /<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/,
  );

  return {
    name: nameMatch[1].trim(),
    message: messageMatch?.[1].trim() ?? "",
    args: argsMatch?.[1].trim() ?? "",
    stdout: stdoutMatch?.[1].trim() || null,
  };
}

/**
 * Check if message text is only a local-command-stdout (follow-up to a command).
 */
export function extractStandaloneStdout(text: string): string | null {
  const stripped = text
    .replace(HIDDEN_PATTERN, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // If after removing hidden tags, only stdout remains
  const stdoutMatch = stripped.match(
    /^<local-command-stdout>([\s\S]*?)<\/local-command-stdout>$/,
  );
  return stdoutMatch?.[1].trim() || null;
}

/**
 * Strip internal XML tags from message text, keeping only user-visible content.
 */
export function sanitizeMessageText(text: string): string {
  return text
    .replace(HIDDEN_PATTERN, "")
    .replace(
      /<\/?(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)>[^]*?<\/(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)>/g,
      "",
    )
    .replace(
      /<\/?(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)(?:\s[^>]*)?>/g,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatToolInput(input: string): string {
  try {
    const parsed = JSON.parse(input);
    if (parsed.command) return parsed.command;
    if (parsed.file_path) return parsed.file_path;
    if (parsed.pattern) return parsed.pattern;
    if (parsed.query) return parsed.query;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input;
  }
}
