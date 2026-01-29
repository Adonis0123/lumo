"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { CardError } from "@/components/card-error";
import { SessionList, SessionListSkeleton } from "./components";
import { useService } from "./use-service";
import type { ClaudeSession } from "./types";

export function Sessions() {
  const router = useRouter();
  const { sessions, isLoading, error, refetch } = useService();

  const handleSelectSession = (session: ClaudeSession) => {
    // Use query parameter for session path
    const encodedPath = encodeURIComponent(session.fullPath);
    router.push(`/sessions/detail?path=${encodedPath}`);
  };

  return (
    <>
      <PageHeader title={`Sessions (${sessions.length})`}>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <SessionListSkeleton />
        ) : error ? (
          <CardError
            message="Failed to load sessions"
            onRetry={refetch}
            className="m-4 w-full"
          />
        ) : (
          <SessionList
            sessions={sessions}
            onSelectSession={handleSelectSession}
          />
        )}
      </div>
    </>
  );
}
