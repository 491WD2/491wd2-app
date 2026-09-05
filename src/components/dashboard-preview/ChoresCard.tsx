import { Check, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, Task } from "../../data/familyData";
import { createToggleTodayChore } from "../../lib/dashboard-preview/dashboardPreviewHandlers";
import type { DashboardChoreRow } from "../../lib/dashboard-preview/selectDashboardChores";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type ChoresCardProps = {
  data: FamilyData;
  model: DashboardPreviewModel;
  setData: Dispatch<SetStateAction<FamilyData>>;
  go: DashboardGo;
  onOpenTasks?: () => void;
};

export function ChoresCard({ model, setData, go, onOpenTasks }: ChoresCardProps) {
  const { todayIso, choreSelection } = model;
  const toggleTodayChore = createToggleTodayChore({ todayIso, setData });
  const rows = choreSelection.rows;

  return (
    <section className="dp-widget dp-widget--chores" aria-label="Today's chores">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--chores" aria-hidden="true">
            <Sparkles />
          </span>
          <div>
            <h2 className="dp-widget__title">Chores</h2>
            <p className="dp-widget__meta">{choreSelection.summaryLabel}</p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={() => go("/tasks", onOpenTasks)}>
          Open chores
        </button>
      </header>

      {rows.length === 0 ? (
        <p className="dp-empty">{choreSelection.emptyLabel}</p>
      ) : (
        <ul className="dp-checklist dp-checklist--chores">
          {rows.map((row) => (
            <ChoreRow
              key={row.task.id}
              row={row}
              onToggle={() => toggleTodayChore(row.task)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ChoreRow({
  row,
  onToggle,
}: {
  row: DashboardChoreRow;
  onToggle: () => void;
}) {
  const task: Task = row.task;
  const done = row.attention === "completed-today";
  const assignmentLabel =
    task.assignedMemberId || task.owner?.trim() ? "Assigned" : "Household";

  return (
    <li>
      <button
        type="button"
        className={["dp-checklist__row", done ? "is-done" : ""].filter(Boolean).join(" ")}
        onClick={onToggle}
        aria-pressed={done}
      >
        <span className="dp-checklist__check" aria-hidden="true">
          {done ? <Check /> : null}
        </span>
        <span className="dp-checklist__copy">
          <span className="dp-checklist__title">{task.title}</span>
          <span className="dp-checklist__meta">
            {assignmentLabel} · {row.attentionLabel}
          </span>
        </span>
      </button>
    </li>
  );
}
