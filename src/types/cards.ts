import type { ReactNode } from "react";

/** Color-coded hub categories for kiosk cards. */
export type CardCategory = "pantry" | "chores" | "events" | "member-tasks";

/** Pantry shelf-life / stock status for kiosk coloring. */
export type PantryItemStatus = "expired" | "expiring" | "good" | "low-stock";

export type CardProgress = {
  value: number;
  max?: number;
  label?: string;
};

export type CardAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "secondary";
  onClick: () => void;
  disabled?: boolean;
};

export type KioskCardProps = {
  title: string;
  subtitle?: string;
  category?: CardCategory;
  /** Pantry expiration / stock status colors */
  itemStatus?: PantryItemStatus;
  icon?: ReactNode;
  emoji?: string;
  meta?: string;
  imageUrl?: string | null;
  progress?: CardProgress;
  expandable?: boolean;
  expandContent?: ReactNode;
  actions?: CardAction[];
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  className?: string;
  analyticsSurface?: string;
};

export type PantryGridItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: string;
  storageLocation: string;
  store: string;
  notes: string;
  imageUrl: string | null;
};

export type PantrySortKey = "name" | "quantity" | "expiryDate";

export type MemberTaskGridItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  category: CardCategory;
  emoji: string;
  completed: boolean;
  description?: string;
};
