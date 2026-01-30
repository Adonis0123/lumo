"use client";

import type { WrappedData } from "@/src/generated/typeshare-types";

export function LanguageCloud({ data }: { data: WrappedData }) {
  const langs = data.topLanguages;
  const max = langs.length > 0 ? langs[0].count : 1;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Top languages</p>
      <div className="flex flex-col gap-2">
        {langs.map((lang, i) => {
          const pct = Math.max((lang.count / max) * 100, 8);
          return (
            <div key={lang.language} className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 text-right truncate">
                {lang.language}
              </span>
              <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                <div
                  className="h-full rounded bg-[hsl(var(--chart-1))] transition-all"
                  style={{
                    width: `${pct}%`,
                    opacity: 1 - i * 0.12,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                {lang.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
