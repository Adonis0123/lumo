"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { SessionBridge } from "@/src/bridges/session-bridge";
import { computeRestState, computeHealthInsights } from "../../libs";
import {
  DEFAULT_REST_PREFERENCES,
  REST_PREFERENCES_KEY,
} from "../../constants";
import type { RestState, RestPreferences } from "./types";
import type { HealthStats } from "../../types";

function loadPreferences(): RestPreferences {
  if (typeof window === "undefined") return DEFAULT_REST_PREFERENCES;
  try {
    const raw = localStorage.getItem(REST_PREFERENCES_KEY);
    if (raw) return JSON.parse(raw) as RestPreferences;
  } catch {
    // ignore
  }
  return DEFAULT_REST_PREFERENCES;
}

const EMPTY_HEALTH: HealthStats = {
  latestWorkHour: null,
  longestContinuousMin: 0,
  insights: [],
};

export function useService() {
  const [prefs, setPrefs] = useState<RestPreferences>(loadPreferences);
  const [tick, setTick] = useState(0);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => SessionBridge.getSessions(),
  });

  // Re-compute every minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const state: RestState = computeRestState(sessions, prefs);
  const health: HealthStats =
    sessions.length > 0 ? computeHealthInsights(sessions) : EMPTY_HEALTH;

  const updatePreferences = useCallback((next: RestPreferences) => {
    setPrefs(next);
    localStorage.setItem(REST_PREFERENCES_KEY, JSON.stringify(next));
  }, []);

  // Use tick to force re-render
  void tick;

  return { state, health, prefs, updatePreferences, isLoading };
}
