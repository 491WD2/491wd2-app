import { CheckCircle2, MessageSquarePlus, Pencil, Shuffle, SkipForward } from "lucide-react";
import type { Task } from "../../data/familyData";
import { trackMemberQuickAction } from "../../lib/memberDashboardAnalytics";

export type MemberQuickActionsProps = {
  selectedTask: Task | null;
  onComplete: (task: Task) => void;
  onSkip: (task: Task) => void;
  onReassign: (task: Task) => void;
  onAddNote: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function MemberQuickActions({
  selectedTask,
  onComplete,
  onSkip,
  onReassign,
  onAddNote,
  onEdit,
}: MemberQuickActionsProps) {
  const disabled = !selectedTask;
  const done =
    selectedTask?.status === "Done" ||
    selectedTask?.status === "Completed" ||
    selectedTask?.status === "Skipped";

  function fire(actionId: string, handler: (task: Task) => void) {
    if (!selectedTask) {
      return;
    }
    trackMemberQuickAction(actionId, { taskId: selectedTask.id.slice(0, 24) });
    handler(selectedTask);
  }

  return (
    <section className="fh-member-quick" aria-label="Quick actions">
      <p className="w-full text-sm font-semibold text-slate-600">
        {selectedTask
          ? `Selected: ${selectedTask.title}`
          : "Tap a task below, then use quick actions"}
      </p>
      <button
        type="button"
        className="fh-member-quick__btn fh-member-quick__btn--primary"
        disabled={disabled || done}
        onClick={() => fire("complete", onComplete)}
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        Complete
      </button>
      <button
        type="button"
        className="fh-member-quick__btn fh-member-quick__btn--warn"
        disabled={disabled || done}
        onClick={() => fire("skip", onSkip)}
      >
        <SkipForward className="h-5 w-5" aria-hidden />
        Skip
      </button>
      <button
        type="button"
        className="fh-member-quick__btn"
        disabled={disabled}
        onClick={() => fire("reassign", onReassign)}
      >
        <Shuffle className="h-5 w-5" aria-hidden />
        Reassign
      </button>
      <button
        type="button"
        className="fh-member-quick__btn"
        disabled={disabled}
        onClick={() => fire("add_note", onAddNote)}
      >
        <MessageSquarePlus className="h-5 w-5" aria-hidden />
        Add note
      </button>
      <button
        type="button"
        className="fh-member-quick__btn"
        disabled={disabled}
        onClick={() => fire("edit", onEdit)}
      >
        <Pencil className="h-5 w-5" aria-hidden />
        Edit
      </button>
    </section>
  );
}
