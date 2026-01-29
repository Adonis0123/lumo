"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { TimeRangeTabs } from "@/modules/overview/components/time-range-tabs";
import {
  RestReminder,
  EfficiencyScorecard,
  SessionPatterns,
  CostInsights,
  WeeklySummary,
} from "./components";
import { useService } from "./use-service";

export function Analytics() {
  const { timeRange, setTimeRange } = useService();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Analytics">
        <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
      </PageHeader>

      <ScrollArea className="flex-1 bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <RestReminder />
          <EfficiencyScorecard timeRange={timeRange} />
          <SessionPatterns />
          <div className="grid gap-4 lg:grid-cols-2">
            <CostInsights timeRange={timeRange} />
            <WeeklySummary />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
