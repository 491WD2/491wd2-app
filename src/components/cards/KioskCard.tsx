import {
  useCallback,
  useId,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { cn } from "../../lib/utils";
import type { CardAction, CardCategory, CardProgress, KioskCardProps, PantryItemStatus } from "../../types/cards";
import { KioskActionCard } from "./KioskActionCard";
import "./kiosk.css";

export type { CardAction, CardCategory, CardProgress, KioskCardProps, PantryItemStatus };

export type KioskCardTone =
  | CardCategory
  | "neutral"
  | "fridge"
  | "freezer"
  | "warning"
  | "expiring"
  | "expired"
  | "success"
  | "chore"
  | "task"
  | "member";

export type FullKioskCardProps = KioskCardProps & {
  tone?: KioskCardTone;
  badge?: ReactNode;
  badges?: ReactNode[];
  actionsReveal?: "always" | "hover";
  interactive?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  checkboxLabel?: string;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "title" | "onClick">;

const CAT_CLASS: Record<CardCategory, string> = {
  pantry: "fh-kiosk-card--cat-pantry",
  chores: "fh-kiosk-card--cat-chores",
  events: "fh-kiosk-card--cat-events",
  "member-tasks": "fh-kiosk-card--cat-member-tasks",
};

const STATUS_CLASS: Record<PantryItemStatus, string> = {
  good: "fh-kiosk-card--status-good",
  expiring: "fh-kiosk-card--status-expiring",
  expired: "fh-kiosk-card--status-expired",
  "low-stock": "fh-kiosk-card--status-low-stock",
};

const TONE_TO_STATUS: Partial<Record<KioskCardTone, PantryItemStatus>> = {
  expired: "expired",
  expiring: "expiring",
  warning: "expiring",
  success: "good",
};

function resolveClasses(
  category?: CardCategory,
  itemStatus?: PantryItemStatus,
  tone?: KioskCardTone,
): string {
  const parts: string[] = [];
  if (itemStatus) {
    parts.push(STATUS_CLASS[itemStatus]);
  } else if (tone && TONE_TO_STATUS[tone]) {
    parts.push(STATUS_CLASS[TONE_TO_STATUS[tone]!]);
  }
  if (tone === "fridge") {
    parts.push("fh-kiosk-card--loc-fridge");
  } else if (tone === "freezer") {
    parts.push("fh-kiosk-card--loc-freezer");
  } else if (category) {
    parts.push(CAT_CLASS[category]);
  } else if (tone === "chore") {
    parts.push(CAT_CLASS.chores);
  } else if (tone === "task" || tone === "events") {
    parts.push(CAT_CLASS.events);
  } else if (tone === "member") {
    parts.push(CAT_CLASS["member-tasks"]);
  }
  return parts.join(" ");
}

/**
 * Primary kiosk ordering-board card — image, title, progress, checkbox, expand, actions.
 */
export function KioskCard({
  title,
  subtitle,
  category,
  itemStatus,
  icon,
  emoji,
  meta,
  imageUrl,
  progress,
  expandable = false,
  expandContent,
  actions,
  checked,
  onCheckedChange,
  selected = false,
  draggable = false,
  isDragging = false,
  onClick,
  className,
  tone,
  badge,
  badges,
  actionsReveal = "hover",
  interactive = false,
  defaultExpanded = false,
  expanded: expandedProp,
  onExpandedChange,
  checkboxLabel = "Mark complete",
  onDragStart,
  onDragEnd,
  analyticsSurface,
  children,
  ...rest
}: FullKioskCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = expandedProp ?? internalExpanded;
  const checkboxId = useId();

  const setExpanded = useCallback(
    (next: boolean) => {
      if (analyticsSurface) {
        trackInteraction(analyticsSurface, next ? "card_expand" : "card_collapse", {
          title: title.slice(0, 40),
        });
      }
      onExpandedChange?.(next);
      if (expandedProp === undefined) {
        setInternalExpanded(next);
      }
    },
    [analyticsSurface, expandedProp, onExpandedChange, title],
  );

  const handleClick = () => {
    if (analyticsSurface) {
      trackInteraction(analyticsSurface, "card_click", { title: title.slice(0, 40) });
    }
    onClick?.();
  };

  const Tag = interactive || onClick ? "button" : "article";
  const pct =
    progress && progress.max
      ? Math.min(100, Math.round((progress.value / progress.max) * 100))
      : progress
        ? Math.min(100, Math.round(progress.value))
        : 0;

  const badgeNodes = badges ?? (badge ? [badge] : []);

  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      className={cn(
        "fh-kiosk-card",
        resolveClasses(category, itemStatus, tone),
        (interactive || onClick) && "fh-kiosk-card--interactive",
        selected && "fh-kiosk-card--selected",
        isDragging && "fh-kiosk-card--dragging",
        className,
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick || interactive ? handleClick : undefined}
      {...rest}
    >
      <div className="fh-kiosk-card__head">
        {onCheckedChange ? (
          <input
            id={checkboxId}
            type="checkbox"
            className="fh-kiosk-card__checkbox"
            checked={checked ?? false}
            onChange={(e) => {
              e.stopPropagation();
              if (analyticsSurface) {
                trackInteraction(analyticsSurface, "card_complete", {
                  checked: e.target.checked,
                });
              }
              onCheckedChange(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={checkboxLabel}
          />
        ) : null}
        {(emoji || icon || imageUrl) && (
          <span className="fh-kiosk-card__visual" aria-hidden>
            {imageUrl ? <img src={imageUrl} alt="" /> : emoji ?? icon}
          </span>
        )}
        <div className="fh-kiosk-card__body">
          <h3 className="fh-kiosk-card__title">{title}</h3>
          {subtitle ? <p className="fh-kiosk-card__subtitle">{subtitle}</p> : null}
          {meta ? <p className="fh-kiosk-card__meta">{meta}</p> : null}
          {category || badgeNodes.length > 0 ? (
            <div className="fh-kiosk-card__badge-row">
              {category ? <span className="fh-kiosk-card__badge">{category}</span> : null}
              {badgeNodes.map((b, i) => (
                <span key={i}>{b}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {progress ? (
        <div className="fh-kiosk-card__progress-wrap">
          <div className="fh-kiosk-card__progress-label">
            <span>{progress.label ?? "Progress"}</span>
            <span>{pct}%</span>
          </div>
          <div
            className="fh-kiosk-card__progress-track"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="fh-kiosk-card__progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}

      {actions && actions.length > 0 ? (
        <KioskActionCard
          actions={actions}
          reveal={actionsReveal}
          analyticsSurface={analyticsSurface}
          onActionClick={(id) => {
            if (analyticsSurface) {
              trackInteraction(analyticsSurface, "card_action", { action: id });
            }
          }}
        />
      ) : null}

      {expandable && expandContent ? (
        <>
          <button
            type="button"
            className="fh-kiosk-card__expand-btn"
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                <ChevronUp className="inline h-4 w-4" aria-hidden /> Less
              </>
            ) : (
              <>
                <ChevronDown className="inline h-4 w-4" aria-hidden /> Details
              </>
            )}
          </button>
          <div
            className={cn(
              "fh-kiosk-card__expand-panel",
              expanded && "fh-kiosk-card__expand-panel--open",
            )}
          >
            <div className="fh-kiosk-card__expand-inner">{expandContent}</div>
          </div>
        </>
      ) : null}

      {children}
    </Tag>
  );
}
