import { useState } from "react";
import { Sparkles } from "lucide-react";
import { KioskCard } from "../cards/Card";
import "../cards/kiosk.css";
import type { FamilyHubSuggestion } from "../../lib/familyHubDashboardData";
import {
  FAMILY_HUB_ANALYTICS_SURFACE,
  trackFamilyHubSuggestionAction,
} from "../../lib/familyHubDashboardAnalytics";
import { WidgetCard, WidgetHeader } from "../widgets";

export type SmartSuggestionsProps = {
  suggestions: FamilyHubSuggestion[];
  onNavigate: (href: string) => void;
};

export function SmartSuggestions({ suggestions, onNavigate }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <WidgetCard
      aria-label="Smart suggestions"
      header={
        <WidgetHeader
          icon={<Sparkles className="h-6 w-6 text-violet-600" />}
          title="Smart suggestions"
          subtitle="Based on pantry, chores, and calendar data"
        />
      }
    >
      <div className="space-y-3">
        {visible.map((suggestion) => (
          <KioskCard
            key={suggestion.id}
            category={
              suggestion.kind === "expiring" || suggestion.kind === "low_stock"
                ? "pantry"
                : suggestion.kind === "chore"
                  ? "chores"
                  : "events"
            }
            tone={suggestion.priority === "high" ? "warning" : undefined}
            title={suggestion.title}
            subtitle={suggestion.detail}
            emoji={suggestion.emoji}
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
            actions={[
              {
                id: "act",
                label: "Do it",
                variant: "primary",
                onClick: () => {
                  trackFamilyHubSuggestionAction(suggestion.id, suggestion.kind);
                  onNavigate(suggestion.href);
                },
              },
              {
                id: "dismiss",
                label: "Dismiss",
                variant: "secondary",
                onClick: () => setDismissed((prev) => new Set(prev).add(suggestion.id)),
              },
            ]}
            actionsReveal="always"
          />
        ))}
      </div>
    </WidgetCard>
  );
}
