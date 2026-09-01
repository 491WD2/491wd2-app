import { CalendarPlus, ListTodo, NotebookPen, ShoppingCart } from "lucide-react";
import type { DashboardGo } from "./types";

type QuickAddPanelProps = {
  go: DashboardGo;
  onOpenShopping: () => void;
  onOpenTasks?: () => void;
  onOpenCalendar: () => void;
};

const QUICK_ADD_ACTIONS = [
  {
    key: "grocery",
    label: "Add shopping",
    hint: "Grocery item",
    icon: ShoppingCart,
    onClick: (go: DashboardGo, onOpenShopping: () => void) =>
      go("/quick-add?type=grocery&name=", () => go("/shopping", onOpenShopping)),
  },
  {
    key: "chore",
    label: "Add chore",
    hint: "Task for today",
    icon: ListTodo,
    onClick: (go: DashboardGo, _shopping: () => void, onOpenTasks?: () => void) =>
      go("/quick-add?type=chore&title=", onOpenTasks),
  },
  {
    key: "event",
    label: "Add event",
    hint: "Calendar",
    icon: CalendarPlus,
    onClick: (
      go: DashboardGo,
      _shopping: () => void,
      _tasks?: () => void,
      onOpenCalendar?: () => void,
    ) => go("/quick-add?type=event&title=", onOpenCalendar),
  },
  {
    key: "note",
    label: "Add note",
    hint: "Family message",
    icon: NotebookPen,
    onClick: (go: DashboardGo) => go("/quick-add?type=note&title=", () => go("/messages")),
  },
] as const;

export function QuickAddPanel({
  go,
  onOpenShopping,
  onOpenTasks,
  onOpenCalendar,
}: QuickAddPanelProps) {
  return (
    <section className="dashboard-preview__card" aria-label="Quick add">
      <header className="dashboard-preview__card-head">
        <h2 className="dashboard-preview__section-title">Quick Add</h2>
        <p className="dashboard-preview__meta">Jump straight into a new item</p>
      </header>

      <div className="dashboard-preview__quick-actions">
        {QUICK_ADD_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              className="dashboard-preview__quick-action"
              aria-label={`${action.label}, ${action.hint}`}
              onClick={() => action.onClick(go, onOpenShopping, onOpenTasks, onOpenCalendar)}
            >
              <Icon className="dashboard-preview__action-icon" aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
