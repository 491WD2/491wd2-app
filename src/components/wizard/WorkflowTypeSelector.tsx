import {
  CalendarDays,
  Camera,
  ClipboardList,
  Refrigerator,
  ShoppingCart,
  StickyNote,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type WorkflowPickType =
  | "grocery"
  | "chore"
  | "event"
  | "pantry"
  | "note"
  | "task";

const cards: {
  type: WorkflowPickType;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
}[] = [
  {
    type: "chore",
    title: "Add chore",
    description: "Cleaning / chore tracker row (no points).",
    icon: ClipboardList,
  },
  {
    type: "grocery",
    title: "Add shopping item",
    description: "Put something on the household shopping list.",
    icon: ShoppingCart,
  },
  {
    type: "event",
    title: "Add calendar event",
    description: "Appointments, plans, and calendar items.",
    icon: CalendarDays,
  },
  {
    type: "pantry",
    title: "Add pantry item",
    description: "Start a new inventory row with a name.",
    icon: Refrigerator,
  },
  {
    type: "note",
    title: "Add household note",
    description: "Short reminder saved as a note (Docs).",
    icon: StickyNote,
  },
];

type Props = {
  onPickType: (type: WorkflowPickType) => void;
  onScanPantry: () => void;
};

export function WorkflowTypeSelector({ onPickType, onScanPantry }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick add</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">Choose what to add</h2>
        <p className="mt-2 text-sm text-slate-600">
          Pick one — we&apos;ll ask for just the basics next.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.type}
              type="button"
              onClick={() => onPickType(c.type)}
              className={cn(
                "flex min-h-[5.5rem] flex-col items-start gap-2 rounded-[8px] border border-[#ededed] bg-white p-4 text-left shadow-[0_1px_1px_rgba(0,0,0,0.12)] transition hover:border-[#FE9F43]/45 hover:bg-[#FFF4EC]/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
              )}
            >
              <Icon className="h-7 w-7 text-[#F26522]" aria-hidden />
              <span className="text-base font-semibold text-slate-900">{c.title}</span>
              <span className="text-sm text-slate-600">{c.description}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onScanPantry}
          className={cn(
            "flex min-h-[5.5rem] flex-col items-start gap-2 rounded-[8px] border border-dashed border-[#FE9F43]/50 bg-[#FFF4EC]/60 p-4 text-left shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition hover:bg-[#FFF4EC]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
          )}
        >
          <Camera className="h-7 w-7 text-[#E85A1A]" aria-hidden />
          <span className="text-base font-semibold text-slate-900">Scan item</span>
          <span className="text-sm text-slate-600">Open pantry add item with barcode or camera.</span>
        </button>
      </div>
    </div>
  );
}
