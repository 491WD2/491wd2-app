import { Check, ChefHat } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, Task } from "../../data/familyData";
import {
  createToggleKitchenTodayDone,
  createToggleTodayChore,
  isDoneToday,
} from "../../lib/dashboard-preview/dashboardPreviewHandlers";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import { findMemberById, getMemberFullName } from "../../lib/utils";
import type { DashboardGo } from "./types";

type KitchenChoresCardProps = {
  data: FamilyData;
  model: DashboardPreviewModel;
  now: Date;
  setData: Dispatch<SetStateAction<FamilyData>>;
  go: DashboardGo;
  onOpenTasks?: () => void;
};

export function KitchenChoresCard({
  data,
  model,
  now,
  setData,
  go,
  onOpenTasks,
}: KitchenChoresCardProps) {
  const {
    todayIso,
    kitchenName,
    kitchenComplete,
    kitchenAssigned,
    kitchenDayLabel,
    kitchenTodayMember,
    todayChores,
    todayRows,
  } = model;

  const toggleKitchenTodayDone = createToggleKitchenTodayDone({
    data,
    now,
    todayIso,
    kitchenTodayMember,
    setData,
    go,
    onOpenTasks,
  });

  const toggleTodayChore = createToggleTodayChore({ todayIso, setData });

  const choreRows = todayChores.length > 0 ? todayChores.slice(0, 6) : [];
  const fallbackRows = todayChores.length === 0 ? todayRows.slice(0, 6) : [];

  return (
    <section className="dashboard-preview__card" aria-label="Kitchen duty and today's chores">
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <ChefHat className="dashboard-preview__card-icon dashboard-preview__card-icon--kitchen" aria-hidden="true" />
          <div>
            <h2 className="dashboard-preview__section-title">Today&apos;s kitchen duty</h2>
            <p className="dashboard-preview__meta">
              {kitchenAssigned ? "Kitchen duty is assigned for today" : "Assign a lead in chores"}
            </p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/tasks", onOpenTasks)}>
          Open chores
        </button>
      </header>

      <p className="dashboard-preview__hero-name">{kitchenName}</p>
      <p className="dashboard-preview__chip-row">
        <span className="dashboard-preview__chip">{kitchenDayLabel}</span>
        <span
          className={[
            "dashboard-preview__chip",
            kitchenComplete ? "dashboard-preview__chip--done" : "dashboard-preview__chip--open",
          ].join(" ")}
        >
          {kitchenComplete ? "Completed" : "Still open"}
        </span>
      </p>
      <button
        type="button"
        className={[
          "dashboard-preview__button",
          kitchenComplete ? "dashboard-preview__button--secondary" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={toggleKitchenTodayDone}
      >
        {kitchenComplete ? "Mark kitchen duty open" : "Mark kitchen duty done"}
      </button>

      <h3 className="dashboard-preview__subsection-title">Today&apos;s chores</h3>
      {todayChores.length === 0 && todayRows.length === 0 ? (
        <p className="dashboard-preview__placeholder">Nothing due for today yet.</p>
      ) : (
        <ul className="dashboard-preview__list">
          {choreRows.map((task) => (
            <ChoreRow
              key={task.id}
              task={task}
              data={data}
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
  data,
  todayIso,
  onToggle,
}: {
  task: Task;
  data: FamilyData;
  todayIso: string;
  onToggle: () => void;
}) {
  const done = isDoneToday(task, todayIso);
  const assignee = task.assignedMemberId
    ? findMemberById(data, task.assignedMemberId)
    : undefined;

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
            {assignee ? getMemberFullName(assignee) : task.owner || "Household"} ·{" "}
            {done ? "Done" : "Chore"}
          </span>
        </span>
      </button>
    </li>
  );
}
