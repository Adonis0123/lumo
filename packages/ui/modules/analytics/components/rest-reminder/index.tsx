"use client";

import {
  Coffee,
  Sun,
  AlertTriangle,
  Settings2,
  Moon,
  Trophy,
  Clock,
  Footprints,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardLoading } from "@/components/card-loading";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useService } from "./use-service";
import type { RestStatus } from "./types";
import type { HealthInsight } from "../../types";

const STATUS_CONFIG: Record<
  RestStatus,
  {
    label: string;
    description: string;
    icon: typeof Coffee;
    text: string;
    bg: string;
    stroke: string;
  }
> = {
  rested: {
    label: "Rested",
    description: "You're fresh! Great time to tackle complex problems.",
    icon: Sun,
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10 dark:bg-green-500/20",
    stroke: "stroke-green-500",
  },
  "heads-up": {
    label: "Heads Up",
    description: "You've been coding a while. Consider a short break soon.",
    icon: Coffee,
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    stroke: "stroke-amber-500",
  },
  "take-a-break": {
    label: "Take a Break",
    description:
      "Extended coding session detected. Step away, stretch, and hydrate!",
    icon: AlertTriangle,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    stroke: "stroke-red-500",
  },
};

const INSIGHT_ICONS = {
  moon: Moon,
  stretch: Footprints,
  trophy: Trophy,
  clock: Clock,
} as const;

const SEVERITY_STYLES = {
  info: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  success: {
    bg: "bg-green-500/10 dark:bg-green-500/20",
    text: "text-green-600 dark:text-green-400",
  },
} as const;

function ProgressRing({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        strokeWidth="6"
        className="stroke-muted"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn("transition-all duration-700", className)}
      />
    </svg>
  );
}

function formatCodingTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function InsightItem({ insight }: { insight: HealthInsight }) {
  const Icon = INSIGHT_ICONS[insight.icon];
  const style = SEVERITY_STYLES[insight.severity];

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          style.bg
        )}
      >
        <Icon className={cn("size-3.5", style.text)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs text-muted-foreground">{insight.detail}</p>
      </div>
    </div>
  );
}

export function RestReminder() {
  const { state, health, prefs, updatePreferences, isLoading } = useService();
  const [showSettings, setShowSettings] = useState(false);
  const [headsUp, setHeadsUp] = useState(String(prefs.headsUpMinutes));
  const [breakAt, setBreakAt] = useState(String(prefs.breakMinutes));

  if (isLoading) return <CardLoading showTitle />;

  const config = STATUS_CONFIG[state.status];
  const Icon = config.icon;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
        <CardTitle className="text-sm font-medium">Rest Reminder</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="size-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="px-4">
        {showSettings ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-32 text-xs text-muted-foreground">
                Heads up at (min)
              </label>
              <Input
                type="number"
                value={headsUp}
                onChange={(e) => setHeadsUp(e.target.value)}
                className="h-8 w-24"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-32 text-xs text-muted-foreground">
                Break at (min)
              </label>
              <Input
                type="number"
                value={breakAt}
                onChange={(e) => setBreakAt(e.target.value)}
                className="h-8 w-24"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updatePreferences({
                    headsUpMinutes: Number(headsUp) || 60,
                    breakMinutes: Number(breakAt) || 120,
                  });
                  setShowSettings(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current status with ring */}
            <div className="flex items-center gap-6">
              <div className="relative flex shrink-0 items-center justify-center">
                <ProgressRing
                  percent={state.progressPercent}
                  className={config.stroke}
                />
                <div className="absolute">
                  <Icon className={cn("size-6", config.text)} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      config.bg,
                      config.text
                    )}
                  >
                    {config.label}
                  </span>
                  {state.continuousCodingMinutes > 0 && (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCodingTime(state.continuousCodingMinutes)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.description}
                </p>
                {/* Quick stats */}
                {(health.latestWorkHour !== null ||
                  health.longestContinuousMin > 0) && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {health.latestWorkHour !== null && (
                      <span>
                        Latest:{" "}
                        <span className="font-medium text-foreground">
                          {health.latestWorkHour.toString().padStart(2, "0")}:00
                        </span>
                      </span>
                    )}
                    {health.longestContinuousMin > 0 && (
                      <span>
                        Longest stretch:{" "}
                        <span className="font-medium text-foreground">
                          {formatCodingTime(health.longestContinuousMin)}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Health insights */}
            {health.insights.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  {health.insights.map((insight) => (
                    <InsightItem key={insight.title} insight={insight} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
