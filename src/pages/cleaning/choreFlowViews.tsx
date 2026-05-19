import { useMemo, useState, type ReactNode } from "react";
import {
  CHORE_FAMILY_MEMBERS,
  ROTATION_BATH_ROOM_SLUGS,
  ROTATION_KITCHEN_ROOM_SLUGS,
  recordsForCalendarDay,
  useChoreKioskStore,
} from "../../lib/choreData";
import type { ChoreFamilyMember, ChoreFlowHubId, ChoreZipRecordView } from "../../types/chore";
import { KioskChecklistBackBar, statusClass } from "./cleaningShared";

const FLOW_META: Record<
  ChoreFlowHubId,
  { title: string; description: string }
> = {
  today: {
    title: "Today",
    description: "Chores due today or overdue — check them off as you go.",
  },
  "this-week": {
    title: "This Week",
    description: "Tasks with a date in the next seven days.",
  },
  calendar: {
    title: "Calendar",
    description: "Upcoming chores grouped by scheduled date.",
  },
  unscheduled: {
    title: "Unscheduled",
    description: "Tasks without a date — schedule when you are ready.",
  },
  archive: {
    title: "Archive",
    description: "Completed and archived tasks.",
  },
  "weekly-reset": {
    title: "Weekly Reset",
    description: "Overdue or unrealistic chores — set dates and assignees.",
  },
  rotation: {
    title: "Rotation Mapping",
    description: "Kitchen zone (pantry & dining) and bathroom chores — one row per task.",
  },
};

function stripRoomEmoji(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\s]+/u, "").trim() || label;
}

function formatDateLabel(iso: string) {
  if (!iso) {
    return "Unscheduled";
  }
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type TaskHandlers = {
  onToggle: (id: string) => void;
  onMarkDone: (id: string) => void;
  onSnooze: (id: string) => void;
  onEdit: (record: ChoreZipRecordView) => void;
};

function TaskRowActions({
  record,
  handlers,
  showStandardActions = true,
}: {
  record: ChoreZipRecordView;
  handlers: TaskHandlers;
  showStandardActions?: boolean;
}) {
  return (
    <div className="wd-chore-kiosk__item-actions wd-cleaning-page__row-actions">
      {showStandardActions && !record.completed ? (
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
          onClick={() => handlers.onMarkDone(record.id)}
        >
          Mark done
        </button>
      ) : null}
      {showStandardActions ? (
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
          onClick={() => handlers.onSnooze(record.id)}
        >
          Snooze
        </button>
      ) : null}
      {showStandardActions ? (
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
          onClick={() => handlers.onEdit(record)}
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

function TaskEditDrawer({
  record,
  onClose,
  onSave,
}: {
  record: ChoreZipRecordView;
  onClose: () => void;
  onSave: (patch: { title: string; assignedTo: string; notes: string; frequency: string }) => void;
}) {
  const [title, setTitle] = useState(record.displayTitle);
  const [assignedTo, setAssignedTo] = useState(record.assignedTo || record.assigned || "");
  const [notes, setNotes] = useState(record.notes);
  const [frequency, setFrequency] = useState(record.frequency);

  return (
    <div className="wd-chore-kiosk-drawer__backdrop" role="presentation" onClick={onClose}>
      <aside
        className="wd-chore-kiosk-drawer"
        role="dialog"
        aria-labelledby="chore-flow-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wd-chore-kiosk-drawer__head">
          <h2 id="chore-flow-edit-title">Edit task</h2>
          <button type="button" className="wd-chore-kiosk-drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="wd-chore-kiosk-drawer__body">
          <label className="wd-chore-kiosk-drawer__field">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="wd-chore-kiosk-drawer__field">
            Assigned adult
            <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
              <option value="">Unassigned</option>
              {CHORE_FAMILY_MEMBERS.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </label>
          <label className="wd-chore-kiosk-drawer__field">
            Frequency
            <input value={frequency} onChange={(event) => setFrequency(event.target.value)} />
          </label>
          <label className="wd-chore-kiosk-drawer__field">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
          </label>
        </div>
        <footer className="wd-chore-kiosk-drawer__footer">
          <button type="button" className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="wd-chore-kiosk__btn wd-chore-kiosk__btn--primary"
            onClick={() =>
              onSave({
                title: title.trim() || record.displayTitle,
                assignedTo,
                notes,
                frequency,
              })
            }
          >
            Save
          </button>
        </footer>
      </aside>
    </div>
  );
}

function ChoreFlowTaskTable({
  records,
  handlers,
  showDate = true,
}: {
  records: ChoreZipRecordView[];
  handlers: TaskHandlers;
  showDate?: boolean;
}) {
  if (records.length === 0) {
    return <p className="wd-chore-kiosk__empty">No chores in this view.</p>;
  }

  return (
    <div className="wd-cleaning-page__table-wrap">
      <table className="wd-cleaning-page__table wd-cleaning-page__table--flow">
        <thead>
          <tr>
            <th scope="col">Done</th>
            <th scope="col">Task</th>
            <th scope="col">Room</th>
            <th scope="col">Assigned</th>
            {showDate ? <th scope="col">Date</th> : null}
            <th scope="col">Status</th>
            <th scope="col">Notes</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className={record.completed ? "is-done" : undefined}>
              <td>
                <input
                  type="checkbox"
                  checked={record.completed}
                  onChange={() => handlers.onToggle(record.id)}
                  aria-label={`Mark ${record.displayTitle} done`}
                />
              </td>
              <td>
                <span className="wd-cleaning-page__task-title">{record.displayTitle}</span>
              </td>
              <td>{record.roomLabel ? stripRoomEmoji(record.roomLabel) : "—"}</td>
              <td>{record.assignedTo || record.assigned || "—"}</td>
              {showDate ? (
                <td>{record.scheduledDate ? formatDateLabel(record.scheduledDate) : "Unscheduled"}</td>
              ) : null}
              <td>
                <span className={statusClass(record.effectiveStatus)}>{record.effectiveStatus}</span>
              </td>
              <td className="wd-cleaning-page__notes-cell">{record.notes || "—"}</td>
              <td>
                <TaskRowActions record={record} handlers={handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowShell({
  flowId,
  onNavigate,
  children,
}: {
  flowId: ChoreFlowHubId;
  onNavigate: (path: string) => void;
  children: ReactNode;
}) {
  const meta = FLOW_META[flowId];
  return (
    <div className="wd-cleaning-page wd-cleaning-page--flow">
      <KioskChecklistBackBar title={meta.title} onBack={() => onNavigate("/chores")} />
      <header className="wd-chore-kiosk-checklist__header">
        <div className="wd-chore-kiosk-checklist__header-copy">
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </header>
      {children}
    </div>
  );
}

export function ChoreTodayFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage, toggleZipComplete, markDone, snoozeChore, updateTaskEdit } =
    useChoreKioskStore();
  const [editing, setEditing] = useState<ChoreZipRecordView | null>(null);
  const records = recordsForFlowPage("today");

  const handlers: TaskHandlers = {
    onToggle: toggleZipComplete,
    onMarkDone: markDone,
    onSnooze: (id) => snoozeChore(id, 1),
    onEdit: setEditing,
  };

  return (
    <FlowShell flowId="today" onNavigate={onNavigate}>
      <ChoreFlowTaskTable records={records} handlers={handlers} />
      {editing ? (
        <TaskEditDrawer
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateTaskEdit(editing.id, patch);
            setEditing(null);
          }}
        />
      ) : null}
    </FlowShell>
  );
}

export function ChoreThisWeekFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage, toggleZipComplete, markDone, snoozeChore, updateTaskEdit } =
    useChoreKioskStore();
  const [editing, setEditing] = useState<ChoreZipRecordView | null>(null);
  const records = recordsForFlowPage("this-week");
  const handlers: TaskHandlers = {
    onToggle: toggleZipComplete,
    onMarkDone: markDone,
    onSnooze: (id) => snoozeChore(id, 1),
    onEdit: setEditing,
  };
  return (
    <FlowShell flowId="this-week" onNavigate={onNavigate}>
      <ChoreFlowTaskTable records={records} handlers={handlers} />
      {editing ? (
        <TaskEditDrawer
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateTaskEdit(editing.id, patch);
            setEditing(null);
          }}
        />
      ) : null}
    </FlowShell>
  );
}

export function ChoreCalendarFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { completions, today } = useChoreKioskStore();
  const days = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 14; i += 1) {
      const date = new Date(`${today}T12:00:00`);
      date.setDate(date.getDate() + i);
      list.push(date.toISOString().slice(0, 10));
    }
    return list;
  }, [today]);

  return (
    <FlowShell flowId="calendar" onNavigate={onNavigate}>
      <div className="wd-chore-flow-calendar">
        {days.map((day) => {
          const records = recordsForCalendarDay(completions, day);
          if (records.length === 0) {
            return null;
          }
          return (
            <section key={day} className="wd-chore-kiosk__section">
              <div className="wd-chore-kiosk__section-head">
                <h2>{formatDateLabel(day)}</h2>
                <span className="wd-cleaning-page__group-count">{records.length}</span>
              </div>
              <ul className="wd-chore-kiosk__list">
                {records.map((record) => (
                  <li key={record.id} className="wd-chore-kiosk__item">
                    <span className="wd-chore-kiosk__item-title">{record.displayTitle}</span>
                    <span className="wd-chore-kiosk__item-meta">
                      {record.roomLabel ? stripRoomEmoji(record.roomLabel) : null}
                      {record.assignedTo || record.assigned || "Unassigned"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </FlowShell>
  );
}

export function ChoreUnscheduledFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage, setTaskDate } = useChoreKioskStore();
  const records = recordsForFlowPage("unscheduled");
  const { today } = useChoreKioskStore();

  return (
    <FlowShell flowId="unscheduled" onNavigate={onNavigate}>
      <div className="wd-cleaning-page__table-wrap">
        <table className="wd-cleaning-page__table wd-cleaning-page__table--flow">
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Room</th>
              <th scope="col">Assigned</th>
              <th scope="col">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.displayTitle}</td>
                <td>{record.roomLabel ? stripRoomEmoji(record.roomLabel) : "—"}</td>
                <td>{record.assignedTo || record.assigned || "—"}</td>
                <td>
                  <button
                    type="button"
                    className="wd-chore-kiosk__btn wd-chore-kiosk__btn--primary"
                    onClick={() => setTaskDate(record.id, today)}
                  >
                    Schedule today
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FlowShell>
  );
}

export function ChoreArchiveFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage } = useChoreKioskStore();
  const records = recordsForFlowPage("archive");
  return (
    <FlowShell flowId="archive" onNavigate={onNavigate}>
      <ChoreFlowTaskTable
        records={records}
        handlers={{
          onToggle: () => undefined,
          onMarkDone: () => undefined,
          onSnooze: () => undefined,
          onEdit: () => undefined,
        }}
        showDate
      />
    </FlowShell>
  );
}

export function ChoreWeeklyResetFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage, setTaskDate, clearTaskDate, assignChore } = useChoreKioskStore();
  const records = recordsForFlowPage("weekly-reset");

  return (
    <FlowShell flowId="weekly-reset" onNavigate={onNavigate}>
      <div className="wd-cleaning-page__table-wrap">
        <table className="wd-cleaning-page__table wd-cleaning-page__table--flow">
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Room</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.displayTitle}</td>
                <td>{record.roomLabel ? stripRoomEmoji(record.roomLabel) : "—"}</td>
                <td>
                  <span className={statusClass(record.effectiveStatus)}>{record.effectiveStatus}</span>
                </td>
                <td>
                  <input
                    type="date"
                    className="wd-chore-flow-date-input"
                    value={record.scheduledDate || ""}
                    onChange={(event) => setTaskDate(record.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
                    onClick={() => clearTaskDate(record.id)}
                  >
                    Clear date
                  </button>
                </td>
                <td>
                  <select
                    className="wd-chore-flow-assign-select"
                    value={record.assignedTo || record.assigned || ""}
                    onChange={(event) =>
                      assignChore(record.id, event.target.value as ChoreFamilyMember | "")
                    }
                  >
                    <option value="">Unassigned</option>
                    {CHORE_FAMILY_MEMBERS.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 ? (
        <p className="wd-chore-kiosk__empty">Nothing needs a weekly reset right now.</p>
      ) : null}
    </FlowShell>
  );
}

function rotationZoneLabel(slug: string | null) {
  if (!slug) {
    return "Household";
  }
  if ((ROTATION_KITCHEN_ROOM_SLUGS as readonly string[]).includes(slug)) {
    return "Kitchen zone";
  }
  if ((ROTATION_BATH_ROOM_SLUGS as readonly string[]).includes(slug)) {
    return "Bathroom";
  }
  return "Other";
}

export function ChoreRotationFlowPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForFlowPage, assignRotation } = useChoreKioskStore();
  const records = recordsForFlowPage("rotation");

  const kitchen = records.filter(
    (record) => record.roomSlug && (ROTATION_KITCHEN_ROOM_SLUGS as readonly string[]).includes(record.roomSlug),
  );
  const bath = records.filter(
    (record) => record.roomSlug && (ROTATION_BATH_ROOM_SLUGS as readonly string[]).includes(record.roomSlug),
  );

  function renderGroup(title: string, items: ChoreZipRecordView[]) {
    if (items.length === 0) {
      return null;
    }
    return (
      <section className="wd-chore-kiosk__section">
        <div className="wd-chore-kiosk__section-head">
          <h2>{title}</h2>
          <span className="wd-cleaning-page__group-count">{items.length} tasks</span>
        </div>
        <div className="wd-cleaning-page__table-wrap">
          <table className="wd-cleaning-page__table wd-cleaning-page__table--flow">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Room</th>
                <th scope="col">Assigned adult</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id}>
                  <td>{record.displayTitle}</td>
                  <td>{record.roomLabel ? stripRoomEmoji(record.roomLabel) : rotationZoneLabel(record.roomSlug)}</td>
                  <td>
                    <select
                      className="wd-chore-flow-assign-select"
                      value={record.assignedTo || record.assigned || ""}
                      onChange={(event) =>
                        assignRotation(record.id, event.target.value as ChoreFamilyMember | "")
                      }
                    >
                      <option value="">Choose adult…</option>
                      {CHORE_FAMILY_MEMBERS.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <FlowShell flowId="rotation" onNavigate={onNavigate}>
      <p className="wd-chore-flow-rotation-note">
        Kitchen zone uses pantry and dining room tasks from the export. Each task appears once — duplicate
        titles are hidden.
      </p>
      {renderGroup("Kitchen zone", kitchen)}
      {renderGroup("Bathroom", bath)}
      {records.length === 0 ? (
        <p className="wd-chore-kiosk__empty">No rotation chores in kitchen or bathroom zones.</p>
      ) : null}
    </FlowShell>
  );
}

export function ChoreFlowRouter({
  page,
  onNavigate,
}: {
  page: ChoreFlowHubId;
  onNavigate: (path: string) => void;
}) {
  switch (page) {
    case "today":
      return <ChoreTodayFlowPage onNavigate={onNavigate} />;
    case "this-week":
      return <ChoreThisWeekFlowPage onNavigate={onNavigate} />;
    case "calendar":
      return <ChoreCalendarFlowPage onNavigate={onNavigate} />;
    case "unscheduled":
      return <ChoreUnscheduledFlowPage onNavigate={onNavigate} />;
    case "archive":
      return <ChoreArchiveFlowPage onNavigate={onNavigate} />;
    case "weekly-reset":
      return <ChoreWeeklyResetFlowPage onNavigate={onNavigate} />;
    case "rotation":
      return <ChoreRotationFlowPage onNavigate={onNavigate} />;
    default:
      return <ChoreTodayFlowPage onNavigate={onNavigate} />;
  }
}
