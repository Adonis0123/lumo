"use client";

import { useState, useMemo } from "react";
import type { TimeRange, OverviewServiceReturn } from "./types";
import { MOCK_TOKEN_DATA, MOCK_MODEL_DATA, MOCK_SESSIONS } from "./constants";

export function useService(): OverviewServiceReturn {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const stats = useMemo(() => {
    const totalTokens = MOCK_TOKEN_DATA.reduce(
      (sum, d) => sum + d.input + d.output,
      0
    );
    const totalCost = MOCK_SESSIONS.reduce((sum, s) => sum + s.cost, 0);
    const totalSessions = MOCK_SESSIONS.length;
    const totalTools = 156;

    return {
      totalSessions,
      totalTokens,
      totalCost,
      totalTools,
    };
  }, []);

  return {
    timeRange,
    setTimeRange,
    stats,
    tokenData: [...MOCK_TOKEN_DATA],
    modelData: [...MOCK_MODEL_DATA],
    sessions: [...MOCK_SESSIONS],
  };
}
