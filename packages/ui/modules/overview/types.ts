export type TimeRange = "today" | "week" | "month" | "all";

export interface TokenDataPoint {
  date: string;
  input: number;
  output: number;
}

export interface ModelDataPoint {
  name: string;
  value: number;
}

export interface Session {
  id: string;
  title: string;
  model: string;
  tokens: number;
  cost: number;
  duration: string;
  timeAgo: string;
  status: "completed" | "active" | "error";
}

export interface OverviewStats {
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  totalTools: number;
}

export interface OverviewServiceReturn {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  stats: OverviewStats;
  tokenData: TokenDataPoint[];
  modelData: ModelDataPoint[];
  sessions: Session[];
}
