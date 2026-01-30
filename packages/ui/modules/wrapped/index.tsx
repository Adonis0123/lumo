"use client";

import { useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CardError } from "@/components/card-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { WrappedPeriod } from "@/src/generated/typeshare-types";
import {
  HeroStat,
  TopModel,
  TokensConsumed,
  FavoriteTool,
  CostCard,
  CodingStreak,
  PeakHour,
  LanguageCloud,
  ShareButton,
} from "./components";
import { useService } from "./use-service";

export function Wrapped() {
  const { period, setPeriod, data, isLoading, error, refetch } = useService();
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Wrapped">
        <div className="flex items-center gap-2">
          <Button
            variant={period === WrappedPeriod.Month ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(WrappedPeriod.Month)}
          >
            This Month
          </Button>
          <Button
            variant={period === WrappedPeriod.All ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(WrappedPeriod.All)}
          >
            All Time
          </Button>
          {data && <ShareButton targetRef={cardRef} />}
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-muted/40">
        <div className="flex flex-col items-center py-8 px-6">
          {isLoading && (
            <div className="w-full max-w-md rounded-xl border border-border bg-card py-6 animate-pulse">
              <div className="px-6 pb-2">
                <Skeleton className="h-3 w-40 mx-auto" />
              </div>
              <div className="px-6 space-y-1">
                {/* Hero stat skeleton */}
                <div className="flex flex-col items-center gap-2 py-4">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-12 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>

                <Separator />

                {/* Stat rows skeleton */}
                <div className="space-y-4 py-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Language bars skeleton */}
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton
                        className="h-6 flex-1"
                        style={{ width: `${80 - i * 15}%` }}
                      />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && (
            <CardError
              title="Wrapped"
              message="Failed to load data"
              onRetry={() => refetch()}
            />
          )}
          {data && (
            <div ref={cardRef} className="bg-muted p-10">
              <div className="w-full max-w-md rounded-xl border border-border bg-card py-6">
                <div className="px-6 pb-2">
                  <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                    Your Claude Code Wrapped
                  </p>
                </div>
                <div className="px-6 space-y-1">
                  <HeroStat data={data} />

                  <Separator />

                  <div className="space-y-4 py-4">
                    <TopModel data={data} />
                    <TokensConsumed data={data} />
                    <FavoriteTool data={data} />
                    <CostCard data={data} />
                    <CodingStreak data={data} />
                    <PeakHour data={data} />
                  </div>

                  <Separator />

                  <div className="pt-4">
                    <LanguageCloud data={data} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
