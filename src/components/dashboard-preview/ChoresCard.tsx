import { Check, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, Task } from "../../data/familyData";
import { createToggleTodayChore, isDoneToday } from "../../lib/dashboard-preview/dashboardPreviewHandlers";
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
  const { todayIso, todayChores, todayRows, openChoreCount } = model;
  const toggleTodayChore = createToggleTodayChore({ todayIso, setData });

  const choreRows = todayChores.length > 0 ? todayChores.slice(0, 6) : [];
  const fallbackRows = todayChores.length === 0 ? todayRows.slice(0, 6) : [];

  return (
    <section className="dp-widget dp-widget--chores" aria-label="Today's chores">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--chores" aria-hidden="true">
            <Sparkles />
          </span>
          <div>
            <h2 className="dp-widget__title">Chores</h2>
            <p className="dp-widget__meta">
              {openChoreCount === 1 ? "1 open today" : `${openChoreCount} open today`}
            </p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={() => go("/tasks", onOpenTasks)}>
          Open chores
        </button>
      </header>

      {todayChores.length === 0 && todayRows.length === 0 ? (
        <p className="dp-empty">Nothing due for today yet.</p>
      ) : (
        <ul className="dp-checklist dp-checklist--chores">
          {choreRows.map((task) => (
            <ChoreRow
              key={task.id}
              task={task}
              todayIso={todayIso}
              onToggle={() => toggleTodayChore(task)}
            />
          ))}
          {fallbackRows.map((item) => (
            <li key={item.id}>
              <button type="button" className="dp-checklist__row" onClick={() => go("/tasks", onOpenTasks)}>
                <span className="dp-checklist__bullet" aria-hidden="true" />
                <span className="dp-checklist__copy">
                  <span className="dp-checklist__title">{item.title}</span>
                  <span className="dp-checklist__meta">
                    {item.time} · {item.done ? "Done" : "Chore"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ChoreRow({
  task,
  todayIso,
  onToggle,
}: {
  task: Task;
  todayIso: string;
  onToggle: () => void;
}) {
  const done = isDoneToday(task, todayIso);
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
            {assignmentLabel} · {done ? "Done" : "Open"}
          </span>
        </span>
      </button>
    </li>
  );
}
