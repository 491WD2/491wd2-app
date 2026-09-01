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
    tone: "shopping",
    onClick: (go: DashboardGo, onOpenShopping: () => void) =>
      go("/quick-add?type=grocery&name=", () => go("/shopping", onOpenShopping)),
  },
  {
    key: "chore",
    label: "Chore",
    icon: ListTodo,
    tone: "chores",
    onClick: (go: DashboardGo, _shopping: () => void, onOpenTasks?: () => void) =>
      go("/quick-add?type=chore&title=", onOpenTasks),
  },
  {
    key: "event",
    label: "Event",
    icon: CalendarPlus,
    tone: "calendar",
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
    tone: "messages",
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
    <div className="dp-quick-add dashboard-preview__quick-add-inline" aria-label="Quick add" role="region">
      <span className="dp-quick-add__label">Quick Add</span>
      <div className="dp-quick-add__actions">
        {QUICK_ADD_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              className={`dp-quick-add__btn dp-quick-add__btn--${action.tone}`}
              aria-label={`Add ${action.label.toLowerCase()}`}
              onClick={() => action.onClick(go, onOpenShopping, onOpenTasks, onOpenCalendar)}
            >
              <span className={`dp-quick-add__icon dp-quick-add__icon--${action.tone}`} aria-hidden="true">
                <Icon />
              </span>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
