const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  rs: "rust",
  py: "python",
  json: "json",
  css: "css",
  html: "html",
  sh: "bash",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  md: "markdown",
  sql: "sql",
  go: "go",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  java: "java",
  kt: "kotlin",
  xml: "xml",
};

export function inferLang(filePath?: string): string {
  if (!filePath) return "txt";
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "txt";
}
