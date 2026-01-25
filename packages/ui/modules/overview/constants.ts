import type { TokenDataPoint, ModelDataPoint, Session } from "./types";

export const MOCK_TOKEN_DATA: TokenDataPoint[] = [
  { date: "Jan 19", input: 45000, output: 12000 },
  { date: "Jan 20", input: 52000, output: 18000 },
  { date: "Jan 21", input: 38000, output: 9000 },
  { date: "Jan 22", input: 67000, output: 22000 },
  { date: "Jan 23", input: 48000, output: 15000 },
  { date: "Jan 24", input: 72000, output: 28000 },
  { date: "Jan 25", input: 56000, output: 19000 },
] as const;

export const MOCK_MODEL_DATA: ModelDataPoint[] = [
  { name: "Sonnet 4", value: 185000 },
  { name: "Opus 4", value: 42000 },
  { name: "Haiku 3.5", value: 18000 },
] as const;

export const MOCK_SESSIONS: Session[] = [
  {
    id: "1",
    title: "Refactor daemon architecture with Axum handlers",
    model: "claude-sonnet-4",
    tokens: 12300,
    cost: 0.24,
    duration: "8 min",
    timeAgo: "15 min ago",
    status: "completed",
  },
  {
    id: "2",
    title: "Fix database connection pool issues",
    model: "claude-sonnet-4",
    tokens: 5200,
    cost: 0.08,
    duration: "3 min",
    timeAgo: "2 hours ago",
    status: "completed",
  },
  {
    id: "3",
    title: "Implement OTLP metrics parsing",
    model: "claude-opus-4",
    tokens: 28400,
    cost: 1.42,
    duration: "15 min",
    timeAgo: "5 hours ago",
    status: "completed",
  },
  {
    id: "4",
    title: "Debug TypeScript type generation",
    model: "claude-haiku-3.5",
    tokens: 3100,
    cost: 0.02,
    duration: "2 min",
    timeAgo: "Yesterday",
    status: "completed",
  },
] as const;
