/**
 * Example usage for hub Card + PantryGrid + MemberDashboard.
 * Render via App when URL contains `?demo=cards`.
 */
import { useState } from "react";
import { KioskCard } from "./KioskCard";
import { PantryKioskGrid, SAMPLE_PANTRY_ITEMS } from "../pantry/PantryGrid";
import { MemberWeeklyTaskGrid } from "../member/MemberDashboard";
import type { PantryKioskRow } from "../../pages/inventory/InventoryViews";
import type { Task } from "../../data/familyData";

const sampleRows: PantryKioskRow[] = SAMPLE_PANTRY_ITEMS.map((item) => ({
  id: item.id,
  productName: item.name,
  category: item.category,
  quantity: item.quantity,
  unit: item.unit,
  store: item.store,
  storageLocation: item.storageLocation,
  expirationDate: item.expiryDate,
  imageUrl: item.imageUrl,
  status: item.status,
  notes: item.notes,
}));

const sampleTasks: Task[] = [
  {
    id: "demo-task-1",
    title: "Unload dishwasher",
    owner: "Alex",
    status: "Not Started",
    priority: "Medium",
    dueDate: "2026-05-14",
    type: "chore",
    frequency: "daily",
    lastCompletedDate: "",
    nextDueDate: "2026-05-14",
    assignedMemberId: "demo",
  },
];

export function HubCardsExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Hub cards demo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sample pantry grid, category cards, and member chores. OpenFoodFacts + scanning wire through
          PantryTabPage in production.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Category cards</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KioskCard category="pantry" title="Pantry" subtitle="Dry goods" emoji="🫙" progress={{ value: 72, label: "Stock" }} expandable expandContent={<p>Shelf A</p>} />
          <KioskCard category="chores" title="Chores" subtitle="Due today" emoji="🧹" progress={{ value: 40, max: 100 }} />
          <KioskCard category="events" title="Events" subtitle="Soccer practice" emoji="⚽" />
          <KioskCard category="member-tasks" title="Member" subtitle="Weekly goals" emoji="🎯" checked onCheckedChange={() => {}} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pantry grid</h2>
        <PantryKioskGrid
          items={sampleRows}
          selectedId={selectedId}
          onSelect={setSelectedId}
          formatDate={(iso: string) => iso}
          layout="grid"
          onScanRequest={() => alert("Opens ProductScanPanel + OpenFoodFacts in app")}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Member weekly grid</h2>
        <MemberWeeklyTaskGrid
          tasks={sampleTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={(t) => setSelectedTaskId(t.id)}
          onCompleteTask={() => alert("Task completed")}
          getTaskDueDate={(t) => t.nextDueDate || t.dueDate}
        />
      </section>
    </div>
  );
}
