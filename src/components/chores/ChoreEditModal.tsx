import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChoreMarkDoneOptions } from "../../context/ChoreShellContext";
import type { ChoreTask } from "../../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../../types/chore";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { trackModal } from "../../lib/kioskAnalytics";
import { choreClasses, choreCtaClass, choreCn, choreTw } from "../../lib/choreUi";

const MODAL_SURFACE = "chores:edit-modal";

export type ChoreEditModalProps = {
  task: ChoreTask | null;
  open: boolean;
  onClose: () => void;
  onSave: (taskId: string, assignee: HouseholdMember | "", note: string) => void;
  onMarkDone: (task: ChoreTask, options?: ChoreMarkDoneOptions) => void;
  onSkip: (taskId: string, reason: string) => void;
};

/** Animated edit dialog — assignee, notes, save / done / skip. Escape closes; focus trapped. */
export function ChoreEditModal({
  task,
  open,
  onClose,
  onSave,
  onMarkDone,
  onSkip,
}: ChoreEditModalProps) {
  const [assignee, setAssignee] = useState<HouseholdMember | "">("");
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const assignId = useId();
  const notesId = useId();
  const titleId = useId();

  useFocusTrap(dialogRef, open);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        trackModal(MODAL_SURFACE, "close", task?.id);
        onClose();
      }
    },
    [onClose, task?.id],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleEscape]);

  useEffect(() => {
    if (!task) {
      return;
    }
    setAssignee(task.assignedTo);
    setNote(task.improvementNotes || task.notes || "");
  }, [task]);

  useEffect(() => {
    if (open && task) {
      trackModal(MODAL_SURFACE, "open", task.id);
    }
  }, [open, task]);

  if (!open || !task) {
    return null;
  }

  return (
    <div className="wd-chore-hh__modal-layer">
      <button
        type="button"
        className="wd-chore-hh__modal-scrim"
        aria-label="Close dialog"
        onClick={() => {
          trackModal(MODAL_SURFACE, "close", task.id);
          onClose();
        }}
      />
      <div
        ref={dialogRef}
        className={choreClasses.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="wd-chore-hh__modal-head">
          <h2 id={titleId}>{task.title}</h2>
          <button
            type="button"
            className={choreCn("wd-chore-hh__modal-close", choreTw.focusRing)}
            onClick={() => {
              trackModal(MODAL_SURFACE, "close", task.id);
              onClose();
            }}
            aria-label="Close edit dialog"
          >
            <span aria-hidden>×</span>
          </button>
        </header>
        <p className="wd-chore-hh__modal-meta" id={`${titleId}-meta`}>
          {task.room} · {task.frequency} · Due {task.dueDate}
        </p>
        <label className="wd-chore-hh__field" htmlFor={assignId}>
          <span>Assigned to</span>
          <select
            id={assignId}
            value={assignee}
            aria-describedby={`${titleId}-meta`}
            onChange={(e) => setAssignee(e.target.value as HouseholdMember | "")}
          >
            <option value="">Unassigned</option>
            {HOUSEHOLD_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="wd-chore-hh__field" htmlFor={notesId}>
          <span>Notes</span>
          <textarea
            id={notesId}
            value={note}
            rows={4}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Improvement notes or reminders"
          />
        </label>
        <div className="wd-chore-hh__modal-actions">
          <button
            type="button"
            className={choreCn(choreCtaClass("primary"), choreTw.focusRing)}
            onClick={() => {
              trackModal(MODAL_SURFACE, "save", task.id);
              onSave(task.id, assignee, note);
              onClose();
            }}
          >
            Save changes
          </button>
          {task.status !== "Done" ? (
            <button
              type="button"
              className={choreCn(choreCtaClass("success"), choreTw.focusRing)}
              onClick={() => {
                onMarkDone(task, { surface: MODAL_SURFACE, via: "modal" });
                onClose();
              }}
            >
              Mark done
            </button>
          ) : null}
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), choreTw.focusRing)}
            aria-label={`Skip ${task.title}`}
            onClick={() => {
              const reason = window.prompt("Skip reason (optional):") ?? "Skipped";
              trackModal(MODAL_SURFACE, "skip", task.id);
              onSkip(task.id, reason);
              onClose();
            }}
          >
            Skip task
          </button>
        </div>
      </div>
    </div>
  );
}
