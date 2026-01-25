"use client";

import { Pie, PieChart, Label } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ModelDataPoint } from "../types";

interface ModelDistributionProps {
  data: ModelDataPoint[];
}

const chartConfig = {
  value: {
    label: "Tokens",
  },
  sonnet4: {
    label: "Sonnet 4",
    color: "var(--chart-1)",
  },
  opus4: {
    label: "Opus 4",
    color: "var(--chart-2)",
  },
  haiku35: {
    label: "Haiku 3.5",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const NAME_TO_KEY: Record<string, string> = {
  "Sonnet 4": "sonnet4",
  "Opus 4": "opus4",
  "Haiku 3.5": "haiku35",
};

export function ModelDistribution({ data }: ModelDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map((item) => ({
    ...item,
    fill: `var(--color-${NAME_TO_KEY[item.name] || item.name})`,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Model Usage</CardTitle>
        <CardDescription>Token distribution by model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-lg font-semibold"
                          >
                            {(total / 1000).toFixed(0)}K
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="flex-1 space-y-2">
            {data.map((item, index) => {
              const key = NAME_TO_KEY[item.name] || item.name;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: `var(--color-${key})` }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
