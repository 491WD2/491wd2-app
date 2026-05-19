import { Plus, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import type { Task } from "../../data/familyData";
import type { MemberChoreSuggestion, MemberTaskProgress } from "../../types/memberTasks";
import { Button } from "../ui/Button";
import { KioskCard, KioskStatCard } from "../cards/Card";
import "../cards/kiosk.css";
import { trackAiSuggestionActed, trackAiSuggestionDismissed } from "../../lib/hubAiAnalytics";

export type MemberSuggestionsProps = {
  memberId: string;
  suggestions: MemberChoreSuggestion[];
  progress: MemberTaskProgress;
  tasksById: Map<string, Task>;
  onCompleteTask?: (task: Task) => void;
  onOpenTasks?: () => void;
  onOpenCalendar?: () => void;
};

function ProgressCard({ period }: { period: MemberTaskProgress["weekly"] }) {
  return (
    <KioskStatCard
      label={`${period.completed} of ${period.target} completed`}
      value={`${period.percent}%`}
      emoji={period.emoji}
      category="member-tasks"
      className="fh-kiosk-card--compact"
    />
  );
}

/**
 * Member dashboard AI — chore recommendations and weekly/monthly progress.
 */
export function MemberSuggestions({
  suggestions,
  progress,
  tasksById,
  onCompleteTask,
  onOpenTasks,
  onOpenCalendar,
}: MemberSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <section
      className="overflow-hidden rounded-[24px] border-2 border-[#e8ecf1] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
      aria-label="Personalized suggestions"
    >
      <div className="border-b border-[#e8ecf1] bg-gradient-to-r from-violet-50/90 to-blue-50/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-violet-700 shadow-sm ring-1 ring-[#e8ecf1]"
              aria-hidden
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">AI suggestions</h2>
              <p className="text-sm text-slate-600">
                Based on your completion patterns — no notes stored in analytics.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onOpenTasks ? (
              <Button type="button" variant="secondary" onClick={onOpenTasks}>
                <Plus className="h-4 w-4" />
                Add task
              </Button>
            ) : null}
            {onOpenCalendar ? (
              <Button type="button" variant="ghost" onClick={onOpenCalendar}>
                Calendar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <ul className="space-y-3">
          {visible.length === 0 ? (
            <li>
              <KioskCard
                tone="neutral"
                title="All caught up"
                subtitle="Check back when new chores are assigned."
                emoji="🎉"
              />
            </li>
          ) : (
            visible.map((suggestion) => (
              <li key={suggestion.id}>
                <KioskCard
                  tone={suggestion.priority === "high" ? "warning" : "member"}
                  title={suggestion.title}
                  subtitle={suggestion.detail}
                  emoji={suggestion.emoji ?? "🧠"}
                  icon={!suggestion.emoji ? <Target className="h-4 w-4" /> : undefined}
                  actions={[
                    ...(suggestion.taskId && suggestion.actionLabel && onCompleteTask
                      ? [
                          {
                            id: "act",
                            label: suggestion.actionLabel,
                            variant: "primary" as const,
                            onClick: () => {
                              const task = tasksById.get(suggestion.taskId!);
                              if (task) {
                                onCompleteTask(task);
                                trackAiSuggestionActed(
                                  "member:dashboard",
                                  suggestion.id,
                                  suggestion.kind,
                                  "complete_task",
                                );
                              }
                            },
                          },
                        ]
                      : []),
                    {
                      id: "dismiss",
                      label: "Dismiss",
                      onClick: () => {
                        setDismissed((prev) => new Set(prev).add(suggestion.id));
                        trackAiSuggestionDismissed(
                          "member:dashboard",
                          suggestion.id,
                          suggestion.kind,
                        );
                      },
                    },
                  ]}
                  actionsReveal="always"
                />
              </li>
            ))
          )}
        </ul>

        <aside className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Progress
          </h3>
          <ProgressCard period={progress.weekly} />
          <ProgressCard period={progress.monthly} />
          {progress.peakDays.length > 0 ? (
            <KioskCard
              tone="task"
              title="Peak days"
              subtitle={progress.peakDays.join(", ")}
              emoji="📊"
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
