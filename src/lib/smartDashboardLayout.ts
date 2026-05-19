/**
 * Future-safe household dashboard widget layout metadata.
 * Not persisted yet — swap this structure into admin settings or a dedicated store when ready.
 * No drag/resize; `order` is for stable sorting only.
 */

/** Relative width hints for a 12-column grid at `lg` (see SmartDashboardGridItem). */
export type SmartDashboardWidgetSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export type SmartDashboardWidgetLayout = {
  id: string;
  title: string;
  size: SmartDashboardWidgetSize;
  order: number;
  visible: boolean;
};

/** Maps layout size → `lg` column span (1–12). */
export const smartDashboardSizeToLgSpan: Record<SmartDashboardWidgetSize, number> = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 7,
  xl: 8,
  full: 12,
};

/** Sort by `order` ascending; filter `visible` when rendering. */
export function sortDashboardWidgets(
  widgets: readonly SmartDashboardWidgetLayout[],
): SmartDashboardWidgetLayout[] {
  return [...widgets].sort((a, b) => a.order - b.order);
}
