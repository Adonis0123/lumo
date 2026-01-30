"use client";

import { PageHeader } from "@/components/page-header";
import { TimeRangeTabs } from "@/modules/overview/components/time-range-tabs";
import {
  PerformanceRadar,
  CacheHitInsight,
  PeakHoursChart,
  ModelMix,
  TokenBreakdown,
  SessionLengthDistribution,
  ErrorRateLiquid,
  TokenModelChart,
} from "./components";
import { useService } from "./use-service";

export function Analytics() {
  const { timeRange, setTimeRange } = useService();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Analytics">
        <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 min-w-0">
              <PerformanceRadar timeRange={timeRange} />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col min-w-0">
              <CacheHitInsight timeRange={timeRange} />
              <ErrorRateLiquid timeRange={timeRange} />
            </div>
          </div>
          <PeakHoursChart timeRange={timeRange} />
          <div className="grid gap-4 md:grid-cols-2">
            <ModelMix timeRange={timeRange} />
            <SessionLengthDistribution timeRange={timeRange} />
          </div>
          <TokenModelChart timeRange={timeRange} />
          <TokenBreakdown timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
}
