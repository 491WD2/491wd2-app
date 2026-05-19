/**
 * Back-compat barrel — prefer KioskCard, KioskStatCard, KioskActionCard, KioskCardGrid.
 */
import "./kiosk.css";

export {
  KioskCard as Card,
  KioskCard,
  type FullKioskCardProps as KioskCardProps,
  type KioskCardTone,
  type CardAction,
  type CardCategory,
  type CardProgress,
} from "./KioskCard";

export type { KioskCardProps as HubCardProps } from "../../types/cards";
export type { CardAction as KioskCardAction, CardProgress as KioskCardProgress } from "../../types/cards";

export { KioskStatCard, KioskStatCard as KioskMetricCard } from "./KioskStatCard";
export { KioskActionCard } from "./KioskActionCard";
export { KioskCardGrid } from "./KioskCardGrid";
