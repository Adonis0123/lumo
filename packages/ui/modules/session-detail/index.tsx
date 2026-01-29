"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CardError } from "@/components/card-error";
import { MessageItem, SessionHeader, SessionDetailSkeleton } from "./components";
import { useService } from "./use-service";
import type { SessionDetailModuleProps } from "./types";

export function SessionDetail({ sessionPath }: SessionDetailModuleProps) {
  const router = useRouter();
  const { sessionDetail, isLoading, error } = useService(sessionPath);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleBack = useCallback(() => {
    router.push("/sessions");
  }, [router]);

  const messages = sessionDetail?.messages ?? [];

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated average message height
    overscan: 10,
  });

  if (isLoading) {
    return <SessionDetailSkeleton />;
  }

  if (error || !sessionDetail) {
    return (
      <div className="flex h-full items-center justify-center">
        <CardError
          message={error?.message || "Failed to load session"}
          onRetry={handleBack}
        />
      </div>
    );
  }

  const { session } = sessionDetail;

  return (
    <div className="flex h-full flex-col">
      <SessionHeader
        session={session}
        messageCount={messages.length}
        onBack={handleBack}
      />

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No messages in this session
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MessageItem message={messages[virtualItem.index]} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
