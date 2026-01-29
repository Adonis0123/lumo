"use client";

import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, SETTINGS_ITEM } from "./constants";
import type { UseServiceReturn } from "./types";

const ROUTE_MAP: Record<string, string> = {
  dashboard: "/",
  sessions: "/sessions",
  analytics: "/analytics",
  settings: "/settings",
} as const;

const PATH_TO_ID: Record<string, string> = {
  "/": "dashboard",
  "/sessions": "sessions",
  "/analytics": "analytics",
  "/settings": "settings",
} as const;

export function useService(): UseServiceReturn {
  const router = useRouter();
  const pathname = usePathname();

  const activeItem = PATH_TO_ID[pathname] || "dashboard";

  const handleNavItemClick = (id: string) => {
    const route = ROUTE_MAP[id];
    if (route) {
      router.push(route);
    }
  };

  return {
    navItems: [...NAV_ITEMS, SETTINGS_ITEM],
    activeItem,
    onNavItemClick: handleNavItemClick,
  };
}
