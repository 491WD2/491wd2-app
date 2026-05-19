import { useMemo } from "react";
import { ListChecks, Plus } from "lucide-react";
import type { FamilyData, Task, TaskFrequency, TaskStatus } from "../../data/familyData";
import { CANONICAL_HOUSEHOLD_ROSTER_NAMES } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { createActivity } from "../../lib/activity";
import {
  appendChoreChecklistTemplates,
  type ChoreChecklistBundleId,
} from "../../lib/choreChecklistTemplates";
import { compareChoresForDashboardMemberView } from "../../lib/dashboardCommandCenterFilters";
import {
  dueDateForWhenPreset,
  getChoreDueDate,
  inferChoreWhenPreset,
  isChoreDone,
  patchTaskAfterChoreMarkedDone,
  sundayIsoEndOfWeekContaining,
  type ChoreWhenPreset,
} from "../../lib/choreTrackerUtils";
import { getTaskFrequencies } from "../../lib/customization";
import { resolveSessionMemberIdForUi } from "../../lib/familyDataSelectors";
import { getMemberColorById, getReadableMemberTextColor } from "../../lib/memberColors";
import { SMARTHR_CARD, SMARTHR_LABEL, SMARTHR_TITLE } from "../../lib/smarthrUi";
import { cn, findMemberById, formatShortDate, getMemberFullName } from "../../lib/utils";
import { ownerLabelForAssignment } from "../../lib/memberAssignment";

const TRACKER_FREQUENCIES_UI: { value: TaskFrequency; label: string }[] = [
  { value: "one-time", label: "One time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
];

const TRACKER_STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Done"];

const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";

function sortMembersHouseholdOrder(members: FamilyData["familyMembers"]) {
  const order = new Map(
    CANONICAL_HOUSEHOLD_ROSTER_NAMES.map((name, index) => [name.toLowerCase(), index]),
  );
  return members
    .filter((m) => m.status === "active")
    .slice()
    .sort((a, b) => {
      const fa = a.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      const fb = b.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      const ia = order.has(fa) ? order.get(fa)! : 100 + fa.localeCompare(fb);
      const ib = order.has(fb) ? order.get(fb)! : 100 + fb.localeCompare(fa);
      if (ia !== ib) {
        return ia - ib;
      }
      return a.name.localeCompare(b.name);
    });
}

function formatShortTimeFromIso(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(d);
  } catch {
    return "";
  }
}

function frequencyLabel(value: TaskFrequency, adminFrequencies: string[]): string {
  const row = TRACKER_FREQUENCIES_UI.find((r) => r.value === value);
  if (row && (adminFrequencies.includes(value) || value === "as-needed")) {
    return row.label;
  }
  if (value === "quarterly") {
    return "Quarterly";
  }
  return value === "one-time" ? "One time" : value;
}

type Props = {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
  todayIso: string;
  /** Mirrors Home dashboard view — same ordering and emphasis as the household chore card. */
  dashboardViewMemberId: string | null;
  onAddChore: (opts?: { title?: string; frequency?: TaskFrequency }) => void;
};

export function SimpleChoreTracker({ data, setData, todayIso, dashboardViewMemberId, onAddChore }: Props) {
  const admin = data.adminSettings;
  const adminFreqs = getTaskFrequencies(admin);
  const sessionMemberId = resolveSessionMemberIdForUi(data);
  const sortedMembers = useMemo(() => sortMembersHouseholdOrder(data.familyMembers), [data.familyMembers]);

  const chores = useMemo(() => data.tasks.filter((t) => t.type === "chore"), [data.tasks]);

  const { overdue, today, thisWeek, completed } = useMemo(() => {
    const weekEnd = sundayIsoEndOfWeekContaining(todayIso);
    const overdueL: Task[] = [];
    const todayL: Task[] = [];
    const weekL: Task[] = [];
    const beyondL: Task[] = [];
    const doneL: Task[] = [];

    for (const task of chores) {
      if (isChoreDone(task)) {
        doneL.push(task);
        continue;
      }
      const due = getChoreDueDate(task);
      if (due < todayIso) {
        overdueL.push(task);
      } else if (due === todayIso) {
        todayL.push(task);
      } else if (due <= weekEnd) {
        weekL.push(task);
      } else {
        beyondL.push(task);
      }
    }

    doneL.sort((a, b) => {
      const ak = (a.lastCompletedAt || a.lastCompletedDate || "").slice(0, 24);
      const bk = (b.lastCompletedAt || b.lastCompletedDate || "").slice(0, 24);
      const byWhen = bk.localeCompare(ak);
      if (byWhen !== 0) {
        return byWhen;
      }
      return compareChoresForDashboardMemberView(a, b, dashboardViewMemberId, (x, y) =>
        x.title.localeCompare(y.title),
      );
    });
    const sortOpen = (list: Task[]) =>
      [...list].sort((a, b) =>
        compareChoresForDashboardMemberView(a, b, dashboardViewMemberId, (x, y) =>
          getChoreDueDate(x).localeCompare(getChoreDueDate(y)) || x.title.localeCompare(y.title),
        ),
      );

    const thisWeekOrLater = sortOpen([...weekL, ...beyondL]);

    return {
      overdue: sortOpen(overdueL),
      today: sortOpen(todayL),
      thisWeek: thisWeekOrLater,
      completed: doneL,
    };
  }, [chores, todayIso, dashboardViewMemberId]);

  function updateChore(task: Task, updates: Partial<Task>, message: string) {
    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item,
          ),
        },
        {
          type: "updated",
          entityType: "chore",
          entityId: task.id,
          entityTitle: task.title,
          memberId: task.assignedMemberId || undefined,
          message,
        },
      ),
    );
  }

  function appendTemplates(bundle: ChoreChecklistBundleId) {
    const additions = appendChoreChecklistTemplates(data, bundle, todayIso);
    if (additions.length === 0) {
      return;
    }
    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: [...current.tasks, ...additions],
        },
        {
          type: "imported",
          entityType: "chore",
          entityId: additions[0]!.id,
          entityTitle: `Checklist templates (${additions.length})`,
          message: `Added ${additions.length} chore template row(s).`,
        },
      ),
    );
  }

  function renderSection(title: string, items: Task[], empty: string, hint?: string) {
    return (
      <section className={cn(SMARTHR_CARD, "border-[#ededed] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-5")}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={cn("text-[16px] font-semibold", SMARTHR_TITLE)}>{title}</h3>
            {hint ? (
              <p className="mt-1 text-[12px] font-normal leading-snug text-[#8e8e8e]">{hint}</p>
            ) : null}
          </div>
          <span className={cn("shrink-0 text-[12px] font-semibold", SMARTHR_LABEL)}>{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-[14px] leading-relaxed text-[#575757]">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((task) => (
              <ChoreTrackerRow
                key={task.id}
                task={task}
                data={data}
                todayIso={todayIso}
                adminFreqs={adminFreqs}
                sessionMemberId={sessionMemberId}
                sortedMembers={sortedMembers}
                onUpdate={(updates, message) => updateChore(task, updates, message)}
                frequencyLabelFn={(f) => frequencyLabel(f, adminFreqs)}
              />
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          SMARTHR_CARD,
          "flex flex-col gap-3 border-[#ededed] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-5",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(254,159,67,0.2)] text-[#FE9F43]">
            <ListChecks className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]")}>
              Chore tracker
            </p>
            <p className="text-[14px] text-[#575757]">
              Assigned to, when, how often, and status — open lists match Home when a member view is selected there.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-10 rounded-[8px] bg-gradient-to-r from-[#FF6F28] to-[#FF5325] px-4 font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]"
            onClick={() => onAddChore({ title: "New chore", frequency: "weekly" })}
          >
            <Plus className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden />
            Add chore
          </Button>
        </div>
      </div>

      <div className={cn(SMARTHR_CARD, "space-y-3 border-[#ededed] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-5")}>
        <p className={cn(SMARTHR_LABEL)}>Checklist templates</p>
        <p className="text-[13px] text-[#575757]">
          Adds missing rows only (stable ids). Your existing chores are never removed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="font-semibold" onClick={() => appendTemplates("nox")}>
            Nox reset tasks
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="font-semibold"
            onClick={() => appendTemplates("jeremiah")}
          >
            Jeremiah deep clean tasks
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="font-semibold"
            onClick={() => appendTemplates("noxJeremiah")}
          >
            Add Nox + Jeremiah starters
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderSection("Today", today, "No chores due today.")}
        {renderSection(
          "This week",
          thisWeek,
          "No other open chores due through Sunday (includes later dates in this list).",
        )}
        {renderSection(
          "Overdue",
          overdue,
          "Nothing overdue.",
          "Due before today — still visible for everyone in Family view; your rows sort first in Member view.",
        )}
        {renderSection("Completed", completed, "No completed chores recorded yet.")}
      </div>
    </div>
  );
}

function ChoreTrackerRow({
  task,
  data,
  todayIso,
  adminFreqs,
  sessionMemberId,
  sortedMembers,
  onUpdate,
  frequencyLabelFn,
}: {
  task: Task;
  data: FamilyData;
  todayIso: string;
  adminFreqs: string[];
  sessionMemberId: string | undefined;
  sortedMembers: FamilyData["familyMembers"];
  onUpdate: (updates: Partial<Task>, message: string) => void;
  frequencyLabelFn: (f: TaskFrequency) => string;
}) {
  const due = getChoreDueDate(task);
  const done = isChoreDone(task);
  const accent = task.assignedMemberId
    ? getMemberColorById(task.assignedMemberId, data.familyMembers)
    : "#94a3b8";
  const assignee = findMemberById(data, task.assignedMemberId);
  const assigneeReadable = assignee
    ? getReadableMemberTextColor(getMemberFullName(assignee), "light")
    : "#575757";
  const completedByMember = findMemberById(data, task.lastCompletedByMemberId);
  const isPastDueOpen = !done && due < todayIso;
  const completedSummary =
    done && (task.lastCompletedDate?.trim() || task.lastCompletedAt || completedByMember)
      ? (() => {
          const who = completedByMember ? getMemberFullName(completedByMember) : "—";
          const datePart = task.lastCompletedDate?.trim() ? formatShortDate(task.lastCompletedDate) : "—";
          const timePart = task.lastCompletedAt ? formatShortTimeFromIso(task.lastCompletedAt) : "";
          return `Completed ${datePart}${timePart ? ` · ${timePart}` : ""} · ${who}`;
        })()
      : done
        ? "Completed"
        : null;

  const whenValue: ChoreWhenPreset = inferChoreWhenPreset(task, todayIso);
  const freqOptions = TRACKER_FREQUENCIES_UI.filter(
    (o) => adminFreqs.includes(o.value) || o.value === "as-needed",
  );

  function applyWhen(next: ChoreWhenPreset, customIso?: string) {
    const resolved = dueDateForWhenPreset(next, todayIso, customIso ?? due);
    onUpdate(
      {
        dueDate: resolved,
        nextDueDate: resolved,
      },
      `Updated when for chore: ${task.title}.`,
    );
  }

  function onStatusChange(next: TaskStatus) {
    if (next === "Done") {
      const completedBy =
        task.lastCompletedByMemberId?.trim() || sessionMemberId || task.assignedMemberId || undefined;
      const patch = patchTaskAfterChoreMarkedDone(
        task.frequency,
        todayIso,
        new Date().toISOString(),
        completedBy,
        task.dueDate,
        task.nextDueDate,
      );
      onUpdate(patch, `Marked done: ${task.title}.`);
      return;
    }
    onUpdate({ status: next }, `Updated status for chore: ${task.title}.`);
  }

  return (
    <li
      className={cn(
        "rounded-[8px] border p-3 shadow-sm sm:p-4",
        done
          ? "border-emerald-200/80 bg-[#f6fdf9]"
          : isPastDueOpen
            ? "border-amber-200/75 bg-amber-50/45"
            : "border-[#ededed] bg-[#fafafa]",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: isPastDueOpen ? "#d97706" : accent,
      }}
    >
      {completedSummary ? (
        <p className="mb-3 rounded-[6px] border border-emerald-200/70 bg-white/90 px-3 py-2 text-[13px] font-semibold text-emerald-900">
          {completedSummary}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1 sm:col-span-2 lg:col-span-1">
          <span className={cn(SMARTHR_LABEL)}>Chore name</span>
          <Input
            className={SM_INPUT}
            value={task.title}
            onChange={(e) => onUpdate({ title: e.target.value }, `Renamed chore to ${e.target.value}.`)}
          />
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>Assigned to</span>
          <Select
            className={SM_INPUT}
            value={task.assignedMemberId || "__family__"}
            onChange={(e) => {
              const v = e.target.value === "__family__" ? "" : e.target.value;
              const m = v ? findMemberById(data, v) : undefined;
              onUpdate(
                {
                  assignedMemberId: v,
                  owner: m ? getMemberFullName(m) : "Family",
                },
                `Reassigned chore: ${task.title}.`,
              );
            }}
          >
            <option value="__family__">Family</option>
            {sortedMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {getMemberFullName(m)}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>When</span>
          <Select
            className={SM_INPUT}
            value={whenValue}
            onChange={(e) => {
              const next = e.target.value as ChoreWhenPreset;
              if (next === "custom") {
                applyWhen("custom", due);
              } else {
                applyWhen(next);
              }
            }}
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This week</option>
            <option value="custom">Custom date</option>
          </Select>
          {whenValue === "custom" ? (
            <Input
              type="date"
              className={cn(SM_INPUT, "mt-2")}
              value={due.slice(0, 10)}
              onChange={(e) => {
                const v = e.target.value;
                onUpdate({ dueDate: v, nextDueDate: v }, `Updated due date for chore: ${task.title}.`);
              }}
            />
          ) : null}
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>How often</span>
          <Select
            className={SM_INPUT}
            value={task.frequency}
            onChange={(e) =>
              onUpdate(
                { frequency: e.target.value as TaskFrequency },
                `Updated cadence for chore: ${task.title}.`,
              )
            }
          >
            {freqOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {!freqOptions.some((o) => o.value === task.frequency) ? (
              <option value={task.frequency}>{frequencyLabelFn(task.frequency)}</option>
            ) : null}
          </Select>
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>Status</span>
          <Select
            className={SM_INPUT}
            value={
              task.status === "Completed"
                ? "Done"
                : TRACKER_STATUSES.includes(task.status)
                  ? task.status
                  : "Not Started"
            }
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          >
            {TRACKER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "Not Started" ? "Not started" : s === "In Progress" ? "In progress" : s}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-1 sm:col-span-2">
          <span className={cn(SMARTHR_LABEL)}>Notes</span>
          <Textarea
            className={cn(SM_INPUT, "min-h-[4.5rem] resize-y")}
            value={task.notes ?? ""}
            onChange={(e) => onUpdate({ notes: e.target.value }, `Updated notes for chore: ${task.title}.`)}
          />
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>Last completed</span>
          <Input
            type="date"
            className={SM_INPUT}
            value={(task.lastCompletedDate || "").slice(0, 10)}
            onChange={(e) =>
              onUpdate({ lastCompletedDate: e.target.value }, `Updated last completed for chore: ${task.title}.`)
            }
          />
        </label>

        <label className="block space-y-1">
          <span className={cn(SMARTHR_LABEL)}>Completed by</span>
          <Select
            className={SM_INPUT}
            value={task.lastCompletedByMemberId || ""}
            onChange={(e) =>
              onUpdate(
                { lastCompletedByMemberId: e.target.value || undefined },
                `Updated completed-by for chore: ${task.title}.`,
              )
            }
          >
            <option value="">—</option>
            {sortedMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {getMemberFullName(m)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <p className="mt-2 text-[12px] font-medium" style={{ color: assigneeReadable }}>
        {isPastDueOpen ? <span className="font-semibold text-[#92400e]">Past due · </span> : null}
        Due {due}
        {" · "}
        {task.assignedMemberId
          ? ownerLabelForAssignment(data.familyMembers, task.assignedMemberId)
          : "Family"}
      </p>
      {!done && task.lastCompletedDate?.trim() ? (
        <p className="mt-1 text-[11px] leading-snug text-[#637381]">
          Last completed {formatShortDate(task.lastCompletedDate)}
          {task.lastCompletedAt ? ` · ${formatShortTimeFromIso(task.lastCompletedAt)}` : ""}
          {completedByMember ? ` · ${getMemberFullName(completedByMember)}` : ""}
        </p>
      ) : null}
    </li>
  );
}
