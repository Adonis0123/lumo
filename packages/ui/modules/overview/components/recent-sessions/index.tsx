"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Session } from "../types";

interface RecentSessionsProps {
  sessions: Session[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest activity</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.map((session, index) => (
          <div key={session.id}>
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">
                      {session.model.replace("claude-", "")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {session.duration}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {session.timeAgo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex-shrink-0 text-right">
                <p className="text-sm font-medium">
                  {(session.tokens / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground">
                  ${session.cost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No sessions yet</p>
            <p className="mt-1 text-xs">
              Start using Claude Code to see your sessions here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
