import { memo, useCallback, useState, type CSSProperties } from "react";
import type { ChoreTask } from "../../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../../types/chore";
import { trackChoreAssign, trackDragDrop, trackDragStart } from "../../lib/kioskAnalytics";
import { CHORE_DROP_FLASH_MS } from "../../lib/choreMotion";
import { useChoreShell } from "../../context/ChoreShellContext";
import { CHORE_MEMBER_COLORS } from "../../lib/choreTheme";
import { choreClasses, choreCn } from "../../lib/choreUi";
import { ChoreTaskCard } from "./ChoreTaskCard";

const ANALYTICS_SURFACE = "chores:assign-board";

type DropTarget = HouseholdMember | "pool";

export type ChoreDragBoardProps = {
  tasks: ChoreTask[];
  onAssign: (taskId: string, member: HouseholdMember) => void;
  onEdit: (task: ChoreTask) => void;
};

/** Drag-and-drop assign columns with drop-zone highlight and card lift. */
export const ChoreDragBoard = memo(function ChoreDragBoard({
  tasks,
  onAssign,
  onEdit,
}: ChoreDragBoardProps) {
  const { markDone, assignFlashIds } = useChoreShell();
  const [dragging, setDragging] = useState<ChoreTask | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DropTarget | null>(null);
  const [dropFlash, setDropFlash] = useState<DropTarget | null>(null);

  const pool = tasks.filter((t) => !t.assignedTo);
  const byMember = Object.fromEntries(
    HOUSEHOLD_MEMBERS.map((m) => [m, tasks.filter((t) => t.assignedTo === m)]),
  ) as Record<HouseholdMember, ChoreTask[]>;

  const flashDrop = useCallback((target: DropTarget) => {
    setDropFlash(target);
    window.setTimeout(() => setDropFlash((t) => (t === target ? null : t)), CHORE_DROP_FLASH_MS);
  }, []);

  const handleDrop = useCallback(
    (member: HouseholdMember) => {
      if (dragging) {
        trackDragDrop(ANALYTICS_SURFACE, dragging.id, member);
        trackChoreAssign(dragging.id, member, ANALYTICS_SURFACE, "drag_drop");
        onAssign(dragging.id, member);
        flashDrop(member);
      }
      setDragging(null);
      setHoverTarget(null);
    },
    [dragging, flashDrop, onAssign],
  );

  const handleDragStart = useCallback((task: ChoreTask) => {
    trackDragStart(ANALYTICS_SURFACE, task.id);
    setDragging(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setHoverTarget(null);
  }, []);

  const renderCard = (task: ChoreTask) => (
    <ChoreTaskCard
      task={task}
      draggable
      compact
      isDragging={dragging?.id === task.id}
      assignFlash={assignFlashIds.has(task.id)}
      onDragStart={handleDragStart}
      onEdit={onEdit}
      onMarkDone={(task) => markDone(task, { surface: ANALYTICS_SURFACE, via: "button" })}
    />
  );

  const renderColumn = (member: HouseholdMember, columnTasks: ChoreTask[]) => {
    const color = CHORE_MEMBER_COLORS[member];
    const isHover = hoverTarget === member;
    const isFlash = dropFlash === member;
    return (
      <section
        key={member}
        className={choreCn(
          "wd-chore-hh__column",
          isHover && "wd-chore-hh__column--hover",
          isFlash && choreClasses.columnDropFlash,
        )}
        aria-labelledby={`chore-col-${member}`}
        style={{ "--column-accent": color } as CSSProperties}
        onDragOver={(e) => {
          e.preventDefault();
          setHoverTarget(member);
        }}
        onDragLeave={() => setHoverTarget((t) => (t === member ? null : t))}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(member);
        }}
      >
        <header className="wd-chore-hh__column-head">
          <span className="wd-chore-hh__column-dot" aria-hidden />
          <h3 id={`chore-col-${member}`}>{member}</h3>
          <span className="wd-chore-hh__column-count">{columnTasks.length}</span>
        </header>
        <ul className="wd-chore-hh__column-list">
          {columnTasks.map((task) => (
            <li key={task.id}>{renderCard(task)}</li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="wd-chore-hh__board" data-chore-tour="assign-board" onDragEnd={handleDragEnd}>
      <section
        className={choreCn(
          "wd-chore-hh__pool",
          hoverTarget === "pool" && "wd-chore-hh__pool--hover",
          dropFlash === "pool" && choreClasses.poolDropFlash,
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setHoverTarget("pool");
        }}
        onDragLeave={() => setHoverTarget((t) => (t === "pool" ? null : t))}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(null);
          setHoverTarget(null);
          flashDrop("pool");
        }}
      >
        <h3>Unassigned pool</h3>
        <p className="wd-chore-hh__pool-hint">Drag tasks onto a member column to assign</p>
        <ul className="wd-chore-hh__column-list">
          {pool.map((task) => (
            <li key={task.id}>{renderCard(task)}</li>
          ))}
        </ul>
      </section>
      <div className="wd-chore-hh__columns">{HOUSEHOLD_MEMBERS.map((m) => renderColumn(m, byMember[m]))}</div>
    </div>
  );
});
