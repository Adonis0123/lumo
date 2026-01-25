import { useState } from "react";
import { NAV_ITEMS, SETTINGS_ITEM } from "./constants";
import type { UseServiceReturn } from "./types";

export function useService(): UseServiceReturn {
  // TODO: Replace with actual routing state when Next.js navigation is implemented
  const [activeItem, setActiveItem] = useState("dashboard");

  const handleNavItemClick = (id: string) => {
    setActiveItem(id);
    // TODO: Add navigation logic here
  };

  return {
    navItems: [...NAV_ITEMS, SETTINGS_ITEM],
    activeItem,
    onNavItemClick: handleNavItemClick,
  };
}
