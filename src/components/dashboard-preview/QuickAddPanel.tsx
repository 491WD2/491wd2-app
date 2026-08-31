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
    label: "Shopping",
    icon: ShoppingCart,
    onClick: (go: DashboardGo, onOpenShopping: () => void) =>
      go("/quick-add?type=grocery&name=", () => go("/shopping", onOpenShopping)),
  },
  {
    key: "chore",
    label: "Chore",
    icon: ListTodo,
    onClick: (go: DashboardGo, _shopping: () => void, onOpenTasks?: () => void) =>
      go("/quick-add?type=chore&title=", onOpenTasks),
  },
  {
    key: "event",
    label: "Event",
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
    label: "Note",
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
    <section className="dashboard-preview__quick-add-compact" aria-label="Quick add">
      <p className="dashboard-preview__quick-add-compact-label">Quick actions</p>
      <div className="dashboard-preview__quick-add-pills">
        {QUICK_ADD_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              className="dashboard-preview__quick-add-pill"
              aria-label={`Add ${action.label.toLowerCase()}`}
              onClick={() => action.onClick(go, onOpenShopping, onOpenTasks, onOpenCalendar)}
            >
              <Icon className="dashboard-preview__quick-add-pill-icon" aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
