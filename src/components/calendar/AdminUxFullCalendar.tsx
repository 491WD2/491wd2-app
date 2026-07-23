import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventInput } from "@fullcalendar/core";
import type { FamilyData, PlannerEvent, PlannerEventCategory, Task } from "../../data/familyData";
import { getMemberFullName } from "../../lib/utils";
import { FeatherIconTile } from "../icons/FeatherIcon";

type Props = {
  data: FamilyData;
  onOpenCalendar: () => void;
  onDateSelect?: (isoDate: string) => void;
};

const CATEGORY_CLASS: Record<PlannerEventCategory, string> = {
  Family: "bg-theme-subtle",
  Household: "bg-theme-subtle",
  School: "bg-info-subtle",
  "No School": "bg-dark-subtle",
  Activity: "bg-success-subtle",
  Travel: "bg-purple-subtle",
  Chores: "bg-green-subtle",
  Reminder: "bg-yellow-subtle",
  Tentative: "bg-orange-subtle",
  Sports: "bg-success-subtle",
  Medical: "bg-danger-subtle",
  Work: "bg-orange-subtle",
  Church: "bg-purple-subtle",
  Errand: "bg-yellow-subtle",
  Social: "bg-pink-subtle",
  Personal: "bg-cyan-subtle",
  Other: "bg-primary-subtle",
  Meals: "bg-green-subtle",
  Home: "bg-success-subtle",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toStartIso(date: string, time?: string, allDay?: boolean) {
  if (!date) return undefined;
  if (allDay || !time) return date;
  const t = time.length === 5 ? `${time}:00` : time;
  return `${date}T${t}`;
}

function formatTimeLabel(time?: string) {
  if (!time) return "All day";
  try {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return time;
  }
}

function plannerToEvent(event: PlannerEvent, memberName: string): EventInput {
  const start = toStartIso(event.date, event.startTime || event.time, event.isAllDay);
  const end =
    event.endTime && event.date
      ? toStartIso(event.date, event.endTime, false)
      : undefined;
  const timeLabel = event.isAllDay ? "All day" : formatTimeLabel(event.startTime || event.time);
  const html = `
    <p class="mb-0 small fw-medium">${timeLabel}</p>
    <div class="aux-fc-row">
      <span class="aux-fc-dot"></span>
      <span>${escapeHtml(event.title)}</span>
    </div>
    <p class="mb-0 opacity-75 small text-truncated">${escapeHtml(memberName)}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</p>
  `;
  return {
    id: `planner-${event.id}`,
    title: html,
    start,
    end,
    allDay: Boolean(event.isAllDay || (!event.startTime && !event.time)),
    classNames: [CATEGORY_CLASS[event.category] || "bg-primary-subtle"],
    extendedProps: { kind: "planner", raw: event },
  };
}

function taskToEvent(task: Task, memberName: string): EventInput {
  const due = (task.dueDate || task.nextDueDate || "").slice(0, 10);
  if (!due) return { title: task.title, start: new Date().toISOString().slice(0, 10) };
  const start = task.dueTime ? `${due}T${task.dueTime.length === 5 ? `${task.dueTime}:00` : task.dueTime}` : due;
  const html = `
    <p class="mb-0 small fw-medium">${task.dueTime ? formatTimeLabel(task.dueTime) : "Chore"}</p>
    <div class="aux-fc-row">
      <i class="bi bi-stars"></i>
      <span>${escapeHtml(task.title)}</span>
    </div>
    <p class="mb-0 opacity-75 small text-truncated">${escapeHtml(memberName)}${task.zone ? ` · ${escapeHtml(task.zone)}` : ""}</p>
  `;
  return {
    id: `task-${task.id}`,
    title: html,
    start,
    allDay: !task.dueTime,
    classNames: ["bg-orange-subtle"],
    extendedProps: { kind: "task", raw: task },
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEventContent(arg: EventContentArg) {
  return { html: arg.event.title };
}

/**
 * AdminUX-style FullCalendar (month / week / day) driven by household planner + chores.
 */
export function AdminUxFullCalendar({ data, onOpenCalendar, onDateSelect }: Props) {
  const events = useMemo(() => {
    const memberName = (id: string) => {
      const m = data.familyMembers.find((x) => x.id === id);
      return m ? getMemberFullName(m) : "Household";
    };

    const plannerEvents = data.planner.map((e) =>
      plannerToEvent(e, memberName(e.assignedMemberId) || e.assignedPerson || "Family"),
    );

    const choreEvents = data.tasks
      .filter((t) => t.status !== "Done" && t.status !== "Completed" && t.status !== "Skipped")
      .filter((t) => Boolean(t.dueDate || t.nextDueDate))
      .slice(0, 40)
      .map((t) => taskToEvent(t, memberName(t.assignedMemberId)));

    // Soft demo anchors for empty months (AdminUX sample feel)
    const now = new Date();
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());
    const demo: EventInput[] =
      plannerEvents.length + choreEvents.length > 0
        ? []
        : [
            {
              title: `<p class="mb-0 small fw-medium">All day</p><div class="aux-fc-row"><span>Family check-in</span></div>`,
              start: `${y}-${m}-01`,
              classNames: ["bg-success-subtle"],
            },
            {
              title: `<p class="mb-0 small fw-medium">10:30 am</p><div class="aux-fc-row"><i class="bi bi-cart3"></i><span>Grocery run</span></div>`,
              start: `${y}-${m}-${d}T10:30:00`,
              classNames: ["bg-orange-subtle"],
            },
          ];

    return [...plannerEvents, ...choreEvents, ...demo];
  }, [data.familyMembers, data.planner, data.tasks]);

  return (
    <div className="aux-card mb-4">
      <div className="aux-card-header flex-wrap">
        <FeatherIconTile name="calendar" tone="cyan" size={18} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base">Household calendar</h3>
          <p className="aux-muted">FullCalendar · month / week / day</p>
        </div>
        <button type="button" className="btn btn-light-color btn-info" onClick={onOpenCalendar}>
          Open planner
        </button>
      </div>
      <div className="aux-card-body">
        <div id="calendar" className="aux-fullcalendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            height="auto"
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventContent={renderEventContent}
            dateClick={(info) => onDateSelect?.(info.dateStr)}
            dayMaxEvents={3}
          />
        </div>
      </div>
    </div>
  );
}
