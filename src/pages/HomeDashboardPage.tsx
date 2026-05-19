import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChefHat, ClipboardList, Home, NotebookPen, Package } from "lucide-react";
import {
  HomeArrowButtonIcon,
  HomeBarcodeButtonIcon,
  HomeCalendarButtonIcon,
  HomeCalendarCardIcon,
  HomeCameraButtonIcon,
  HomeChoreCardIcon,
  HomeClockButtonIcon,
  HomeListButtonIcon,
  HomeMailButtonIcon,
  HomeMessageCardIcon,
  HomePantryCardIcon,
  HomePencilButtonIcon,
  HomePlusRingButtonIcon,
  HomeScanCardIcon,
  HomeShoppingCardIcon,
} from "../components/home/homeSimpleActionIcons";
import {
  HOME_SIMPLE_ACTIONS,
  HOME_SIMPLE_SIDE_LINKS,
  HOME_SIMPLE_SIDE_NOTES,
  resolveHomeCardNavigation,
} from "../lib/homeDashboardData";
import type { HomeDashboardCardId, HomeSimpleActionCard } from "../types/homeDashboard";

export type HomeDashboardPageProps = {
  onOpenHomeCard: (cardId: HomeDashboardCardId) => void;
  onOpenOriginalBuild: () => void;
};

const CLOCK_REFRESH_MS = 30_000;
const SIDE_ICON_SIZE = 18;
const KITCHEN_ICON_SIZE = 18;
const DUTY_ICON_SIZE = 32;
const NOTES_ICON_SIZE = 22;

const ACTION_CARD_ICONS = {
  "scan-item": HomeScanCardIcon,
  "add-shopping-item": HomeShoppingCardIcon,
  "add-pantry-item": HomePantryCardIcon,
  "add-chore": HomeChoreCardIcon,
  "add-message": HomeMessageCardIcon,
  "add-calendar-event": HomeCalendarCardIcon,
} as const;

const ACTION_PRIMARY_ICONS = {
  "scan-item": HomeBarcodeButtonIcon,
  "add-shopping-item": HomePlusRingButtonIcon,
  "add-pantry-item": HomePencilButtonIcon,
  "add-chore": HomeCalendarButtonIcon,
  "add-message": HomeMailButtonIcon,
  "add-calendar-event": HomeCalendarButtonIcon,
} as const;

const ACTION_SECONDARY_ICONS = {
  "scan-item": HomeCameraButtonIcon,
  "add-shopping-item": HomeListButtonIcon,
  "add-pantry-item": HomeClockButtonIcon,
  "add-chore": HomeClockButtonIcon,
  "add-message": HomePencilButtonIcon,
  "add-calendar-event": HomeArrowButtonIcon,
} as const;

const SIDE_LINK_ICONS = {
  "family-hub": Home,
  pantry: Package,
  planner: Calendar,
} as const;

function WelcomeBranchIcon() {
  return (
    <svg className="wd-home-simple__welcome-branch" viewBox="0 0 120 110" aria-hidden>
      <path
        d="M18 72 C26 50 36 30 54 14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <path
        d="M54 14 C68 22 82 38 94 58"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <path
        d="M36 40 C46 32 58 32 70 40"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <path
        d="M26 56 C36 48 48 48 58 56"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <ellipse cx="36" cy="38" rx="10" ry="6" transform="rotate(-24 36 38)" fill="currentColor" opacity="0.9" />
      <ellipse cx="66" cy="40" rx="10" ry="6" transform="rotate(18 66 40)" fill="currentColor" opacity="0.9" />
      <ellipse cx="48" cy="54" rx="9" ry="5.5" transform="rotate(-8 48 54)" fill="currentColor" opacity="0.86" />
      <ellipse cx="74" cy="52" rx="9" ry="5.5" transform="rotate(24 74 52)" fill="currentColor" opacity="0.86" />
    </svg>
  );
}

function ActionCardIcon({ card }: { card: HomeSimpleActionCard }) {
  const Icon = ACTION_CARD_ICONS[card.id as keyof typeof ACTION_CARD_ICONS] ?? HomePantryCardIcon;
  return <Icon className="wd-home-action-card__glyph" />;
}

function ActionButtonIcon({ card, variant }: { card: HomeSimpleActionCard; variant: "primary" | "secondary" }) {
  const Icon =
    variant === "primary"
      ? (ACTION_PRIMARY_ICONS[card.id as keyof typeof ACTION_PRIMARY_ICONS] ?? HomePlusRingButtonIcon)
      : (ACTION_SECONDARY_ICONS[card.id as keyof typeof ACTION_SECONDARY_ICONS] ?? HomeArrowButtonIcon);
  return <Icon className="wd-home-action-card__button-glyph" />;
}

export default function HomeDashboardPage({
  onOpenHomeCard,
  onOpenOriginalBuild,
}: HomeDashboardPageProps) {
  const [inlineStatus, setInlineStatus] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), CLOCK_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const dateLine = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [now],
  );

  const timeParts = useMemo(() => {
    const parts = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(now);

    const hour = parts.find((part) => part.type === "hour")?.value ?? "";
    const minute = parts.find((part) => part.type === "minute")?.value ?? "";
    const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";

    return {
      clock: `${hour}:${minute}`,
      period,
    };
  }, [now]);

  const runAction = useCallback(
    (targetId: HomeDashboardCardId | undefined, fallbackStatus: string) => {
      if (!targetId) {
        setInlineStatus(fallbackStatus);
        return;
      }

      const target = resolveHomeCardNavigation(targetId);
      if (target.kind === "planned") {
        setInlineStatus(fallbackStatus);
        onOpenHomeCard(targetId);
        return;
      }

      setInlineStatus(fallbackStatus);
      onOpenHomeCard(targetId);
    },
    [onOpenHomeCard],
  );

  const handleSideLink = useCallback(
    (targetId: HomeDashboardCardId | undefined, fallbackStatus?: string) => {
      if (targetId) {
        runAction(targetId, fallbackStatus ?? "Opening household page.");
        return;
      }
      setInlineStatus(fallbackStatus ?? "Opening household page.");
      onOpenOriginalBuild();
    },
    [onOpenOriginalBuild, runAction],
  );

  return (
    <div className="wd-home wd-home-simple" style={{ background: "var(--bd-bg-app)" }}>
      <div className="wd-home-simple__board">
        <div className="wd-home-simple__layout">
        <div className="wd-home-simple__main">
          <section className="wd-home-simple__welcome" aria-labelledby="wd-home-simple-title">
            <div className="wd-home-simple__welcome-main">
              <WelcomeBranchIcon />
              <div className="wd-home-simple__welcome-copy">
                <h1 id="wd-home-simple-title" className="wd-home-simple__title">
                  Welcome Home
                </h1>
                <p className="wd-home-simple__subtitle">Let&apos;s keep our home running smoothly.</p>
              </div>
            </div>
            <div className="wd-home-simple__datetime" aria-live="polite">
              <time className="wd-home-simple__date" dateTime={now.toISOString()}>
                {dateLine}
              </time>
              <span className="wd-home-simple__time-row">
                <span className="wd-home-simple__time">{timeParts.clock}</span>
                <span className="wd-home-simple__time-period">{timeParts.period}</span>
              </span>
            </div>
          </section>

          {inlineStatus ? (
            <p className="wd-home-simple__status wd-home__inline-status" aria-live="polite">
              {inlineStatus}
            </p>
          ) : null}

          <div className="wd-home-simple__cards">
            {HOME_SIMPLE_ACTIONS.map((card) => (
              <article key={card.id} className={`wd-home-action-card wd-home-action-card--${card.id}`}>
                <div className="wd-home-action-card__head">
                  <span className="wd-home-action-card__icon" aria-hidden>
                    <ActionCardIcon card={card} />
                  </span>
                  <div className="wd-home-action-card__content">
                    <h2 className="wd-home-action-card__title">{card.title}</h2>
                    <p className="wd-home-action-card__text">{card.description}</p>
                  </div>
                </div>
                <div className="wd-home-action-card__actions">
                  <button
                    type="button"
                    className="wd-home-action-card__button wd-home-action-card__button--primary"
                    onClick={() => runAction(card.primaryTargetId, card.primaryFallbackStatus)}
                  >
                    <span className="wd-home-action-card__button-icon" aria-hidden>
                      <ActionButtonIcon card={card} variant="primary" />
                    </span>
                    {card.primaryAction}
                  </button>
                  <button
                    type="button"
                    className="wd-home-action-card__button wd-home-action-card__button--secondary"
                    onClick={() => runAction(card.secondaryTargetId, card.secondaryFallbackStatus)}
                  >
                    <span className="wd-home-action-card__button-icon" aria-hidden>
                      <ActionButtonIcon card={card} variant="secondary" />
                    </span>
                    {card.secondaryAction}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="wd-home-simple__side" aria-label="Household notes and links">
          <div className="wd-home-simple__side-shell">
          <div className="wd-home-simple__side-heading">Kitchen Duty</div>
          <section className="wd-home-simple__side-card wd-home-simple__side-card--duty">
            <div className="wd-home-simple__duty-profile">
              <span className="wd-home-simple__duty-avatar" aria-hidden>
                <ChefHat size={DUTY_ICON_SIZE} strokeWidth={1.75} />
              </span>
              <div className="wd-home-simple__duty-copy">
                <p className="wd-home-simple__side-label">Today&apos;s Kitchen Duty</p>
                <p className="wd-home-simple__side-value">Stella</p>
                <p className="wd-home-simple__side-meta">{dateLine}</p>
              </div>
            </div>
          </section>
          <button
            type="button"
            className="wd-home-simple__kitchen-checklist wd-home-action-card__button wd-home-action-card__button--primary"
            onClick={() => setInlineStatus("Kitchen checklist will open next.")}
          >
            <span className="wd-home-action-card__button-icon" aria-hidden>
              <ClipboardList size={KITCHEN_ICON_SIZE} strokeWidth={1.9} />
            </span>
            Kitchen Checklist
          </button>
          <button
            type="button"
            className="wd-home-simple__side-text-link"
            onClick={() => setInlineStatus("Kitchen instructions will open next.")}
          >
            Open kitchen instructions
          </button>

          <div className="wd-home-simple__side-heading">Notes</div>
          <section className="wd-home-simple__side-card wd-home-simple__side-card--notes">
            <span className="wd-home-simple__side-icon" aria-hidden>
              <NotebookPen size={NOTES_ICON_SIZE} strokeWidth={1.75} />
            </span>
            <ul className="wd-home-simple__side-notes">
              {HOME_SIMPLE_SIDE_NOTES.map((note) => (
                <li key={note.id}>{note.text}</li>
              ))}
            </ul>
          </section>

          <div className="wd-home-simple__side-heading">Family Hub</div>
          <button
            type="button"
            className="wd-home-simple__kitchen-checklist wd-home-action-card__button wd-home-action-card__button--secondary"
            onClick={() => onOpenOriginalBuild()}
          >
            Open full household app
          </button>
          <section className="wd-home-simple__side-card wd-home-simple__side-card--links">
            <ul className="wd-home-simple__side-links">
              {HOME_SIMPLE_SIDE_LINKS.map((link) => {
                const LinkIcon = SIDE_LINK_ICONS[link.id as keyof typeof SIDE_LINK_ICONS] ?? Home;
                return (
                  <li key={link.id}>
                    <button
                      type="button"
                      className="wd-home-simple__side-link"
                      onClick={() => handleSideLink(link.targetId, link.fallbackStatus)}
                    >
                      <span className="wd-home-simple__side-link-icon" aria-hidden>
                        <LinkIcon size={SIDE_ICON_SIZE} strokeWidth={1.75} />
                      </span>
                      <span className="wd-home-simple__side-link-copy">
                        <span className="wd-home-simple__side-link-label">{link.label}</span>
                        {link.description ? (
                          <span className="wd-home-simple__side-link-desc">{link.description}</span>
                        ) : null}
                      </span>
                      <span className="wd-home-simple__side-link-chevron" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

            <p className="wd-home-simple__quote">
              <span className="wd-home-simple__side-footer-icon" aria-hidden>
                ♥
              </span>
              A happy home runs together.
            </p>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}
