"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WrappedBridge } from "@/src/bridges/wrapped-bridge";
import { WrappedPeriod } from "@/src/generated/typeshare-types";

export function useService() {
  const [period, setPeriod] = useState<WrappedPeriod>(WrappedPeriod.Today);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["wrapped-data", period],
    queryFn: () => WrappedBridge.getWrappedData(period),
  });

  return {
    period,
    setPeriod,
    data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
