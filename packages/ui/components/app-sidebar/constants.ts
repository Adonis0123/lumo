import { LayoutDashboard, History, BarChart3, Settings } from "lucide-react";
import type { NavItem } from "./types";

export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: History,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
] as const satisfies readonly NavItem[];

export const SETTINGS_ITEM = {
  id: "settings",
  label: "Settings",
  icon: Settings,
} as const satisfies NavItem;
