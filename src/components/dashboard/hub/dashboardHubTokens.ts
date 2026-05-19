import { cn } from "../../../lib/utils";
import {
  SMARTHR_CARD,
  SMARTHR_HUB_CARD_TITLE,
  SMARTHR_HUB_MUTED,
  SMARTHR_HUB_WIDGET_ICON,
} from "../../../lib/smarthrUi";

/**
 * Hub cards — SmartHR tokens (`src/lib/smarthrUi.ts`); Tailwind template reference only.
 */
/** Home hub only — no `dark:` variants so SmartHR light survives global `html.dark`. */
export const hubCardClass = cn(
  SMARTHR_CARD,
  "p-3.5 transition-colors duration-150 sm:p-4",
);

export const hubCardTitleClass = SMARTHR_HUB_CARD_TITLE;

export const hubMutedClass = SMARTHR_HUB_MUTED;

export const hubDashWidgetIconClass = SMARTHR_HUB_WIDGET_ICON;
