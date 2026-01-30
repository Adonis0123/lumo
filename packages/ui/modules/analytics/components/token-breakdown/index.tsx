"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { CardEmpty } from "@/components/card-empty";
import { useService } from "./use-service";
import type { TokenBreakdownProps } from "./types";
import { fmt } from "@/lib/format";

export function TokenBreakdown({ timeRange }: TokenBreakdownProps) {
  const { data, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) return <CardLoading showTitle />;
  if (error)
    return (
      <CardError
        title="Token Breakdown"
        message="Failed to load data"
        onRetry={() => refetch()}
      />
    );
  if (data.length === 0)
    return <CardEmpty title="Token Breakdown" message="No token data" />;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle>Token Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-left py-2 font-medium">Model</th>
              <th className="text-right py-2 font-medium">Input</th>
              <th className="text-right py-2 font-medium">Output</th>
              <th className="text-right py-2 font-medium">Cache Read</th>
              <th className="text-right py-2 font-medium">Cache Create</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.model} className="border-b border-border/50">
                <td className="py-2 font-medium">{d.displayName}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {fmt(d.input, "number")}
                </td>
                <td className="py-2 text-right text-muted-foreground">
                  {fmt(d.output, "number")}
                </td>
                <td className="py-2 text-right text-muted-foreground">
                  {fmt(d.cacheRead, "number")}
                </td>
                <td className="py-2 text-right text-muted-foreground">
                  {fmt(d.cacheCreation, "number")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
