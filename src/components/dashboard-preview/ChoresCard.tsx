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
    <section
      className="dashboard-preview__card dashboard-preview__card--chores"
      aria-label="Today's chores"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <Sparkles className="dashboard-preview__card-icon dashboard-preview__card-icon--chores" aria-hidden="true" />
          <div>
            <h2 className="dashboard-preview__section-title">Chores</h2>
            <p className="dashboard-preview__meta">
              {openChoreCount === 1 ? "1 open today" : `${openChoreCount} open today`}
            </p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/tasks", onOpenTasks)}>
          Open chores
        </button>
      </header>

      {todayChores.length === 0 && todayRows.length === 0 ? (
        <p className="dashboard-preview__placeholder">Nothing due for today yet.</p>
      ) : (
        <ul className="dashboard-preview__list dashboard-preview__list--chores">
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
              <button type="button" className="dashboard-preview__row" onClick={() => go("/tasks", onOpenTasks)}>
                <span className="dashboard-preview__row-main">
                  <span className="dashboard-preview__row-title">{item.title}</span>
                  <span className="dashboard-preview__row-meta">
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
        className={["dashboard-preview__row", done ? "is-done" : ""].filter(Boolean).join(" ")}
        onClick={onToggle}
        aria-pressed={done}
      >
        <span className="dashboard-preview__row-check" aria-hidden="true">
          {done ? <Check className="dashboard-preview__check-icon" /> : null}
        </span>
        <span className="dashboard-preview__row-main">
          <span className="dashboard-preview__row-title">{task.title}</span>
          <span className="dashboard-preview__row-meta">
            {assignmentLabel} · {done ? "Done" : "Open"}
          </span>
        </span>
      </button>
    </li>
  );
}
