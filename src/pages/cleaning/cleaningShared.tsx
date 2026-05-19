import { useEffect, useMemo, useState } from "react";
import { CHORE_FAMILY_MEMBERS, CHORE_ZIP_ROOMS, useChoreKioskStore } from "../../lib/choreData";
import type {
  ChoreFamilyMember,
  ChoreStatus,
  ChoreZipRecordView,
  CleaningCadence,
  CleaningPageId,
} from "../../types/chore";
import { CHORE_HUB_SESSION_KEY, hubCardForPage } from "./choreHub";

export type CleaningPageMeta = {
  id: CleaningPageId;
  title: string;
  description: string;
  path: string;
};

export const CLEANING_PAGE_META: CleaningPageMeta[] = [
  {
    id: "today",
    title: "Today",
    description: "Tasks due now — daily work plus anything overdue.",
    path: "/cleaning/today",
  },
  {
    id: "daily",
    title: "Daily Cleaning",
    description: "Everyday resets and quick room touch-ups.",
    path: "/cleaning/daily",
  },
  {
    id: "weekly",
    title: "Weekly Cleaning",
    description: "This week's tasks grouped by room.",
    path: "/cleaning/weekly",
  },
  {
    id: "monthly",
    title: "Monthly Cleaning",
    description: "Monthly maintenance and deeper touch-ups.",
    path: "/cleaning/monthly",
  },
  {
    id: "seasonal",
    title: "Seasonal Cleaning",
    description: "Seasonal batches and infrequent household resets.",
    path: "/cleaning/seasonal",
  },
  {
    id: "yearly",
    title: "Yearly Cleaning",
    description: "Annual cleaning sessions and long-interval work.",
    path: "/cleaning/yearly",
  },
  {
    id: "deep",
    title: "Deep Cleaning Checklist",
    description: "Full cleaning sessions from the export.",
    path: "/cleaning/deep",
  },
  {
    id: "recurring",
    title: "Recurring Tasks",
    description: "Inbox and unscheduled recurring household tasks.",
    path: "/cleaning/recurring",
  },
  {
    id: "supplies",
    title: "Cleaning Supplies / Restock",
    description: "Track restock items — saved locally on this device.",
    path: "/cleaning/supplies",
  },
  {
    id: "rooms",
    title: "Room Checklists",
    description: "All tasks for each room in the house.",
    path: "/cleaning/rooms",
  },
];

function resolveChecklistPageId(pageId: CleaningPageId): CleaningPageId {
  if (pageId !== "daily") {
    return pageId;
  }
  if (typeof window !== "undefined" && sessionStorage.getItem(CHORE_HUB_SESSION_KEY) === "today") {
    return "today";
  }
  return pageId;
}

export function KioskChecklistBackBar({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="wd-chore-kiosk-checklist__topbar">
      <button type="button" className="wd-chore-kiosk-checklist__back" onClick={onBack}>
        ← Chores
      </button>
      <span className="wd-chore-kiosk-checklist__topbar-title">{title}</span>
    </div>
  );
}

export function statusClass(status: ChoreStatus) {
  if (status === "Done") {
    return "wd-chore-kiosk__status wd-chore-kiosk__status--done";
  }
  if (status === "In Progress") {
    return "wd-chore-kiosk__status wd-chore-kiosk__status--progress";
  }
  if (status === "Overdue") {
    return "wd-chore-kiosk__status wd-chore-kiosk__status--overdue";
  }
  if (status === "Skipped") {
    return "wd-chore-kiosk__status wd-chore-kiosk__status--skipped";
  }
  return "wd-chore-kiosk__status wd-chore-kiosk__status--todo";
}

type TaskActionHandlers = {
  onToggle: (id: string) => void;
  onMarkDone: (id: string) => void;
  onSnooze: (id: string) => void;
  onEdit: (record: ChoreZipRecordView) => void;
  onDelete?: (id: string) => void;
};

function TaskRowActions({
  record,
  handlers,
}: {
  record: ChoreZipRecordView;
  handlers: TaskActionHandlers;
}) {
  const canDelete = record.id.startsWith("custom-") && handlers.onDelete;
  return (
    <div className="wd-chore-kiosk__item-actions wd-cleaning-page__row-actions">
      {!record.completed ? (
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
          onClick={() => handlers.onMarkDone(record.id)}
        >
          Mark done
        </button>
      ) : null}
      <button
        type="button"
        className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
        onClick={() => handlers.onSnooze(record.id)}
      >
        Snooze
      </button>
      <button
        type="button"
        className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
        onClick={() => handlers.onEdit(record)}
      >
        Edit
      </button>
      {canDelete ? (
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--danger"
          onClick={() => handlers.onDelete!(record.id)}
        >
          Delete
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
        aria-labelledby="chore-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wd-chore-kiosk-drawer__head">
          <h2 id="chore-edit-title">Edit task</h2>
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

function stripRoomEmoji(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\s]+/u, "").trim() || label;
}

type FilterState = {
  search: string;
  assignee: string;
  room: string;
  status: "all" | "open" | "done";
};

function useFilteredRecords(records: ChoreZipRecordView[], filters: FilterState) {
  return useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return records.filter((record) => {
      if (filters.assignee && record.assignedTo !== filters.assignee && record.assigned !== filters.assignee) {
        return false;
      }
      if (filters.room && record.roomSlug !== filters.room) {
        return false;
      }
      if (filters.status === "open" && record.completed) {
        return false;
      }
      if (filters.status === "done" && !record.completed) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        record.displayTitle,
        record.notes,
        record.roomLabel ?? "",
        record.frequency,
        record.assignedTo,
        record.assigned,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filters.assignee, filters.room, filters.search, filters.status, records]);
}

function ChecklistFilters({
  filters,
  onChange,
  showRoomFilter,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  showRoomFilter: boolean;
}) {
  return (
    <div className="wd-cleaning-page__filters">
      <label className="wd-cleaning-page__filter">
        <span>Search</span>
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Task, room, assignee…"
        />
      </label>
      <label className="wd-cleaning-page__filter">
        <span>Assignee</span>
        <select
          value={filters.assignee}
          onChange={(event) => onChange({ ...filters, assignee: event.target.value })}
        >
          <option value="">Everyone</option>
          {CHORE_FAMILY_MEMBERS.map((member: ChoreFamilyMember) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
          <option value="Herschel">Herschel</option>
          <option value="Elijah & Roskens">Elijah & Roskens</option>
        </select>
      </label>
      {showRoomFilter ? (
        <label className="wd-cleaning-page__filter">
          <span>Room</span>
          <select
            value={filters.room}
            onChange={(event) => onChange({ ...filters, room: event.target.value })}
          >
            <option value="">All rooms</option>
            {CHORE_ZIP_ROOMS.map((room) => (
              <option key={room.slug} value={room.slug}>
                {stripRoomEmoji(room.label)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="wd-cleaning-page__filter">
        <span>Status</span>
        <select
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as FilterState["status"] })
          }
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
      </label>
    </div>
  );
}

function RecordTable({
  records,
  handlers,
  showRoom,
}: {
  records: ChoreZipRecordView[];
  handlers: TaskActionHandlers;
  showRoom: boolean;
}) {
  if (records.length === 0) {
    return <p className="wd-chore-kiosk__empty">No tasks match these filters.</p>;
  }

  return (
    <div className="wd-cleaning-page__table-wrap">
      <table className="wd-cleaning-page__table">
        <thead>
          <tr>
            <th scope="col">Done</th>
            <th scope="col">Task</th>
            {showRoom ? <th scope="col">Room</th> : null}
            <th scope="col">Assignee</th>
            <th scope="col">Schedule</th>
            <th scope="col">Status</th>
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
                {record.notes ? <span className="wd-cleaning-page__task-note">{record.notes}</span> : null}
              </td>
              {showRoom ? (
                <td>{record.roomLabel ? stripRoomEmoji(record.roomLabel) : "—"}</td>
              ) : null}
              <td>{record.assignedTo || record.assigned || "—"}</td>
              <td>{record.frequency || record.scheduledDate || "—"}</td>
              <td>
                <span className={statusClass(record.effectiveStatus)}>{record.effectiveStatus}</span>
              </td>
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

function RecordCards({
  records,
  handlers,
  groupByRoom,
}: {
  records: ChoreZipRecordView[];
  handlers: TaskActionHandlers;
  groupByRoom: boolean;
}) {
  const groups = useMemo(() => {
    if (!groupByRoom) {
      return [{ key: "all", label: "Tasks", items: records }];
    }
    const map = new Map<string, ChoreZipRecordView[]>();
    for (const record of records) {
      const key = record.roomSlug ?? "general";
      const existing = map.get(key);
      if (existing) {
        existing.push(record);
      } else {
        map.set(key, [record]);
      }
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      label: items[0]?.roomLabel ? stripRoomEmoji(items[0].roomLabel!) : "General",
      items,
    }));
  }, [groupByRoom, records]);

  if (records.length === 0) {
    return <p className="wd-chore-kiosk__empty">No tasks match these filters.</p>;
  }

  return (
    <div className="wd-cleaning-page__groups">
      {groups.map((group) => (
        <section key={group.key} className="wd-chore-kiosk__section">
          <div className="wd-chore-kiosk__section-head">
            <h2>{group.label}</h2>
            <span className="wd-cleaning-page__group-count">
              {group.items.filter((item) => item.completed).length}/{group.items.length}
            </span>
          </div>
          <ul className="wd-chore-kiosk__list">
            {group.items.map((record) => (
              <li key={record.id} className="wd-chore-kiosk__item wd-cleaning-page__task-row">
                <label className="wd-cleaning-page__check">
                  <input
                    type="checkbox"
                    checked={record.completed}
                    onChange={() => handlers.onToggle(record.id)}
                  />
                  <span className="wd-cleaning-page__check-copy">
                    <span className="wd-chore-kiosk__item-title">{record.displayTitle}</span>
                    <span className="wd-chore-kiosk__item-meta">
                      {record.roomLabel ? (
                        <span>{stripRoomEmoji(record.roomLabel)}</span>
                      ) : null}
                      {record.assignedTo || record.assigned ? (
                        <span>{record.assignedTo || record.assigned}</span>
                      ) : null}
                      {record.frequency ? <span>{record.frequency}</span> : null}
                      {record.scheduledDate ? <span>{record.scheduledDate}</span> : null}
                      <span className={statusClass(record.effectiveStatus)}>{record.effectiveStatus}</span>
                    </span>
                    {record.notes ? (
                      <span className="wd-cleaning-page__task-note">{record.notes}</span>
                    ) : null}
                  </span>
                </label>
                <TaskRowActions record={record} handlers={handlers} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function CleaningChecklistPage({
  pageId,
  roomSlug,
  onNavigate,
}: {
  pageId: CleaningPageId;
  roomSlug?: string;
  onNavigate: (path: string) => void;
}) {
  const effectivePageId = resolveChecklistPageId(pageId);
  const roomMeta =
    effectivePageId === "room" && roomSlug
      ? CHORE_ZIP_ROOMS.find((room) => room.slug === roomSlug)
      : undefined;
  const meta =
    effectivePageId === "room" && roomMeta
      ? {
          id: "room" as const,
          title: stripRoomEmoji(roomMeta.label),
          description: "All tasks for this room — check off as you go.",
          path: `/cleaning/room/${roomSlug}`,
        }
      : CLEANING_PAGE_META.find((entry) => entry.id === effectivePageId)!;
  const {
    recordsForPage,
    toggleZipComplete,
    markDone,
    snoozeChore,
    updateTaskEdit,
    resetSectionCompletions,
    addCustomTask,
    deleteCustomTask,
  } = useChoreKioskStore();
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [editingRecord, setEditingRecord] = useState<ChoreZipRecordView | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    assignee: "",
    room: roomSlug ?? "",
    status: "open",
  });

  const pageCadence: CleaningCadence | null =
    effectivePageId === "daily"
      ? "daily"
      : effectivePageId === "weekly"
        ? "weekly"
        : effectivePageId === "monthly"
          ? "monthly"
          : effectivePageId === "seasonal"
            ? "seasonal"
            : effectivePageId === "yearly"
              ? "yearly"
              : effectivePageId === "deep"
                ? "deep"
                : effectivePageId === "recurring"
                  ? "recurring"
                  : null;

  const taskHandlers: TaskActionHandlers = {
    onToggle: toggleZipComplete,
    onMarkDone: markDone,
    onSnooze: (id) => snoozeChore(id, 1),
    onEdit: setEditingRecord,
    onDelete: deleteCustomTask,
  };

  useEffect(() => {
    return () => {
      if (pageId === "daily") {
        sessionStorage.removeItem(CHORE_HUB_SESSION_KEY);
      }
    };
  }, [pageId]);

  function backToHub() {
    sessionStorage.removeItem(CHORE_HUB_SESSION_KEY);
    onNavigate("/chores");
  }

  const sourceRecords = recordsForPage(effectivePageId, roomSlug);
  const filtered = useFilteredRecords(sourceRecords, filters);
  const completed = filtered.filter((record) => record.completed).length;
  const remaining = filtered.length - completed;

  return (
    <div className="wd-cleaning-page wd-cleaning-page--checklist">
      <KioskChecklistBackBar title={meta.title} onBack={backToHub} />

      <header className="wd-chore-kiosk-checklist__header">
        <div className="wd-chore-kiosk-checklist__header-copy">
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <div className="wd-chore-kiosk-checklist__progress-card">
          <span className="wd-chore-kiosk-checklist__progress-count">{remaining}</span>
          <span className="wd-chore-kiosk-checklist__progress-label">
            {remaining === 1 ? "task left" : "tasks left"}
          </span>
          <span className="wd-chore-kiosk-checklist__progress-done">
            {completed}/{filtered.length} done
          </span>
        </div>
      </header>

      <div className="wd-cleaning-page__header-actions wd-cleaning-page__header-actions--checklist">
        <div className="wd-cleaning-page__view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={viewMode === "cards" ? "is-active" : undefined}
            onClick={() => setViewMode("cards")}
          >
            Checklist
          </button>
          <button
            type="button"
            className={viewMode === "table" ? "is-active" : undefined}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
        {effectivePageId === "room" && roomSlug ? (
          <button
            type="button"
            className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
            onClick={() => onNavigate("/cleaning/rooms")}
          >
            All rooms
          </button>
        ) : null}
        <button
          type="button"
          className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
          onClick={() => {
            if (
              window.confirm(
                `Reset all checkmarks in ${meta.title}? Export tasks stay on the list.`,
              )
            ) {
              resetSectionCompletions(effectivePageId, roomSlug);
            }
          }}
        >
          Reset checklist
        </button>
      </div>

      {pageCadence ? (
        <section className="wd-chore-kiosk__section wd-cleaning-page__add-task">
          <div className="wd-chore-kiosk__section-head">
            <h2>Add task</h2>
          </div>
          <div className="wd-cleaning-page__add-supply">
            <input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Task title"
            />
            <button
              type="button"
              className="wd-chore-kiosk__btn wd-chore-kiosk__btn--primary"
              onClick={() => {
                if (!newTaskTitle.trim()) {
                  return;
                }
                addCustomTask({
                  title: newTaskTitle.trim(),
                  cadence: pageCadence,
                  roomSlug: roomSlug ?? null,
                });
                setNewTaskTitle("");
              }}
            >
              Add task
            </button>
          </div>
        </section>
      ) : null}

      <ChecklistFilters
        filters={filters}
        onChange={setFilters}
        showRoomFilter={effectivePageId !== "room" && !roomSlug}
      />

      {viewMode === "table" ? (
        <RecordTable
          records={filtered}
          handlers={taskHandlers}
          showRoom={effectivePageId !== "room"}
        />
      ) : (
        <RecordCards
          records={filtered}
          handlers={taskHandlers}
          groupByRoom={effectivePageId !== "room" && effectivePageId !== "today"}
        />
      )}

      {editingRecord ? (
        <TaskEditDrawer
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(patch) => {
            updateTaskEdit(editingRecord.id, patch);
            setEditingRecord(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function CleaningRoomsIndexPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recordsForPage } = useChoreKioskStore();
  const hubMeta = hubCardForPage("rooms");

  function backToHub() {
    onNavigate("/chores");
  }

  return (
    <div className="wd-cleaning-page wd-cleaning-page--checklist">
      <KioskChecklistBackBar title="Room Checklists" onBack={backToHub} />
      <header className="wd-chore-kiosk-checklist__header">
        <div className="wd-chore-kiosk-checklist__header-copy">
          <h1>{hubMeta?.title ?? "Room Checklists"}</h1>
          <p>{hubMeta?.subtitle ?? "Pick a room to open its checklist."}</p>
        </div>
      </header>
      <div className="wd-chore-kiosk-hub__grid wd-chore-kiosk-hub__grid--rooms">
        {CHORE_ZIP_ROOMS.map((room) => {
          const records = recordsForPage("room", room.slug);
          const remaining = records.filter((record) => !record.completed).length;
          return (
            <button
              key={room.slug}
              type="button"
              className="wd-chore-kiosk-hub__card wd-chore-kiosk-hub__card--compact"
              onClick={() => onNavigate(`/cleaning/room/${room.slug}`)}
            >
              <span
                className={`wd-chore-kiosk-hub__accent wd-chore-kiosk-hub__accent--${
                  remaining === 0 ? "done" : "teal"
                }`}
                aria-hidden
              />
              <span className="wd-chore-kiosk-hub__card-body">
                <span className="wd-chore-kiosk-hub__card-title">{stripRoomEmoji(room.label)}</span>
                <span className="wd-chore-kiosk-hub__card-count">
                  {remaining === 0 ? "All done" : `${remaining} remaining`}
                </span>
              </span>
              <span className="wd-chore-kiosk-hub__card-chevron" aria-hidden>
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CleaningSuppliesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { supplies, addChore, deleteChore, markDone } = useChoreKioskStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!title.trim()) {
      return;
    }
    addChore({
      title: title.trim(),
      assignedTo: "",
      schedule: "todo",
      dueDate: new Date().toISOString().slice(0, 10),
      recurrence: "none",
      status: "To Do",
      points: 0,
      notes: notes.trim(),
      kind: "supply",
    });
    setTitle("");
    setNotes("");
  }

  const hubMeta = hubCardForPage("supplies");

  function backToHub() {
    onNavigate("/chores");
  }

  return (
    <div className="wd-cleaning-page wd-cleaning-page--checklist">
      <KioskChecklistBackBar title={hubMeta?.title ?? "Supplies / Restock"} onBack={backToHub} />
      <header className="wd-chore-kiosk-checklist__header">
        <div className="wd-chore-kiosk-checklist__header-copy">
          <h1>{hubMeta?.title ?? "Supplies / Restock"}</h1>
          <p>{hubMeta?.subtitle ?? "Restock list saved on this device."}</p>
        </div>
      </header>

      <section className="wd-chore-kiosk__section">
        <div className="wd-chore-kiosk__section-head">
          <h2>Add supply item</h2>
        </div>
        <div className="wd-cleaning-page__add-supply">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Item name" />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes (optional)" />
          <button type="button" className="wd-chore-kiosk__btn wd-chore-kiosk__btn--primary" onClick={handleAdd}>
            Add item
          </button>
        </div>
      </section>

      <section className="wd-chore-kiosk__section">
        <div className="wd-chore-kiosk__section-head">
          <h2>Restock list</h2>
        </div>
        {supplies.length === 0 ? (
          <p className="wd-chore-kiosk__empty">No supply items yet.</p>
        ) : (
          <ul className="wd-chore-kiosk__list">
            {supplies.map((item) => (
              <li key={item.id} className="wd-chore-kiosk__item">
                <div className="wd-chore-kiosk__item-main">
                  <p className="wd-chore-kiosk__item-title">{item.title}</p>
                  {item.notes ? <p className="wd-chore-kiosk__item-notes">{item.notes}</p> : null}
                </div>
                <div className="wd-chore-kiosk__item-actions">
                  {item.status !== "Done" ? (
                    <button
                      type="button"
                      className="wd-chore-kiosk__btn wd-chore-kiosk__btn--ghost"
                      onClick={() => markDone(item.id)}
                    >
                      Mark stocked
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="wd-chore-kiosk__btn wd-chore-kiosk__btn--danger"
                    onClick={() => {
                      if (window.confirm(`Remove “${item.title}” from the restock list?`)) {
                        deleteChore(item.id);
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
