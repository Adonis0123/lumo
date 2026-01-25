"use client";

import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Circle } from "lucide-react";

export type DaemonStatus = "connected" | "disconnected" | "connecting";

interface PageHeaderProps {
  title: string;
  daemonStatus?: DaemonStatus;
  children?: React.ReactNode;
}

const STATUS_CONFIG = {
  connected: { label: "Daemon", color: "text-green-500" },
  disconnected: { label: "Offline", color: "text-red-500" },
  connecting: { label: "Connecting", color: "text-yellow-500" },
} as const;

export function PageHeader({ title, daemonStatus, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-8" />
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{title}</h1>
          {daemonStatus && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Circle
                className={`size-2 fill-current ${STATUS_CONFIG[daemonStatus].color}`}
              />
              {STATUS_CONFIG[daemonStatus].label}
            </Badge>
          )}
        </div>
      </div>

      {children && <div>{children}</div>}
    </header>
  );
}
