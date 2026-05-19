import { useEffect, useState } from "react";
import type { FamilyMember, Task } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";

export type MemberTaskEditModalProps = {
  open: boolean;
  task: Task | null;
  familyMembers: FamilyMember[];
  mode: "edit" | "note";
  onClose: () => void;
  onSave: (taskId: string, patch: Partial<Pick<Task, "title" | "notes" | "assignedMemberId" | "owner">>) => void;
};

export function MemberTaskEditModal({
  open,
  task,
  familyMembers,
  mode,
  onClose,
  onSave,
}: MemberTaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");

  useEffect(() => {
    if (!task) {
      return;
    }
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setAssignedMemberId(task.assignedMemberId);
  }, [task]);

  if (!task) {
    return null;
  }

  const titleLabel = mode === "note" ? "Add note" : "Edit task";

  return (
    <Modal
      open={open}
      title={titleLabel}
      variant="smarthr"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              const member = familyMembers.find((m) => m.id === assignedMemberId);
              onSave(task.id, {
                title: mode === "edit" ? title.trim() || task.title : task.title,
                notes: notes.trim(),
                assignedMemberId,
                owner: member?.name ?? task.owner,
              });
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      {mode === "edit" ? (
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      ) : null}
      <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
        Notes
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note for this task…"
        />
      </label>
      {mode === "edit" ? (
        <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
          Assign to
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base font-medium text-slate-800"
            value={assignedMemberId}
            onChange={(e) => setAssignedMemberId(e.target.value)}
          >
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </Modal>
  );
}
