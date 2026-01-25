"use client";

import { Boxes, Zap, DollarSign, Wrench } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  TimeRangeTabs,
  TokenChart,
  ModelDistribution,
  RecentSessions,
} from "./components";
import { useService } from "./use-service";

export function Overview() {
  const { timeRange, setTimeRange, stats, tokenData, modelData, sessions } =
    useService();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Overview" daemonStatus="connected">
        <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
      </PageHeader>

      <ScrollArea className="flex-1 bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Sessions"
              value={stats.totalSessions.toString()}
              description="+3 from today"
              icon={<Boxes className="size-4" />}
            />
            <StatCard
              title="Tokens"
              value={`${(stats.totalTokens / 1000).toFixed(1)}K`}
              description="+12% from last week"
              icon={<Zap className="size-4" />}
            />
            <StatCard
              title="Cost"
              value={`$${stats.totalCost.toFixed(2)}`}
              description="-5% from last week"
              icon={<DollarSign className="size-4" />}
            />
            <StatCard
              title="Tool Calls"
              value={stats.totalTools.toString()}
              description="This week"
              icon={<Wrench className="size-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TokenChart data={tokenData} />
            </div>
            <div className="lg:col-span-2">
              <ModelDistribution data={modelData} />
            </div>
          </div>

          <RecentSessions sessions={sessions} />
        </div>
      </ScrollArea>
    </div>
  );
}
