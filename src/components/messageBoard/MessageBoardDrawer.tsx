import { useEffect, useId, useMemo, useState } from "react";
import type {
  MessageBoardCategoryDefinition,
  MessageBoardItem,
  MessageBoardPriority,
  FamilyMember,
} from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerHeader,
  DrawerPanel,
} from "../workspace/DrawerShell";
import { useDrawerEscape } from "../../hooks/useDrawerEscape";
import { membersForAssignmentSelect } from "../../lib/memberAssignment";
import { cn, getMemberFullName } from "../../lib/utils";
import { getCategoryChipClasses, getPriorityColorClasses } from "../../lib/colorCoding";

const PRIORITIES: MessageBoardPriority[] = ["low", "normal", "important", "urgent"];

function priorityLabel(p: MessageBoardPriority): string {
  switch (p) {
    case "low":
      return "Low";
    case "normal":
      return "Normal";
    case "important":
      return "Important";
    case "urgent":
      return "Urgent";
    default:
      return p;
  }
}

export function MessageBoardDrawer({
  open,
  mode,
  draft,
  categories,
  familyMembers,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: "create" | "edit";
  draft: MessageBoardItem | null;
  categories: MessageBoardCategoryDefinition[];
  familyMembers: FamilyMember[];
  onClose: () => void;
  onSave: (item: MessageBoardItem, isNew: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  const [form, setForm] = useState<MessageBoardItem | null>(draft);
  const drawerTitleId = useId();

  useEffect(() => {
    setForm(draft);
  }, [draft?.id, open]);

  useDrawerEscape(open, onClose);

  const categoryOptions = useMemo(() => categories.map((c) => c.label), [categories]);
  const categorySelectOptions = useMemo(
    () => selectOptionsWithCurrent(categoryOptions, form?.category),
    [categoryOptions, form?.category],
  );

  if (!open || !form) {
    return null;
  }

  const baseForm = form;

  function syncColorForCategory(categoryLabel: string) {
    const found = categories.find((c) => c.label === categoryLabel);
    return found?.colorKey ?? baseForm.colorKey;
  }

  function handleCategoryChange(label: string) {
    setForm((f) =>
      f
        ? {
            ...f,
            category: label,
            colorKey: syncColorForCategory(label),
          }
        : f,
    );
  }

  const relatedPool = membersForAssignmentSelect(
    familyMembers,
    baseForm.authorMemberId,
    ...(baseForm.relatedMemberIds ?? []),
  );

  function toggleRelated(id: string) {
    setForm((f) => {
      if (!f) return f;
      const cur = new Set(f.relatedMemberIds ?? []);
      if (cur.has(id)) {
        cur.delete(id);
      } else {
        cur.add(id);
      }
      return {
        ...f,
        relatedMemberIds: cur.size > 0 ? [...cur] : undefined,
      };
    });
  }

  function submit() {
    const f = baseForm;
    if (!f) return;
    const title = f.title.trim();
    const message = f.message.trim();
    if (!title && !message) {
      return;
    }
    const now = new Date().toISOString();
    const next: MessageBoardItem = {
      ...f,
      title,
      message,
      updatedAt: now,
      category: f.category.trim() || "General",
      colorKey: syncColorForCategory(f.category.trim() || "General"),
    };
    onSave(next, mode === "create");
  }

  const catChip = getCategoryChipClasses(form.category, form.colorKey);
  const priChip = getPriorityColorClasses(form.priority);

  return (
    <>
      <DrawerBackdrop ariaLabel="Close message editor" onClick={onClose} />
      <DrawerPanel
        className={cn(
          "lg:max-w-[min(92vw,40rem)] overflow-hidden !rounded-[8px] !border-[#ededed] !bg-white shadow-[0_12px_48px_rgba(15,23,42,0.12)] max-lg:!rounded-none max-lg:!border-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
      >
        <DrawerHeader
          eyebrow="Message Board"
          titleId={drawerTitleId}
          title={displayTitle(form)}
          subtitle={
            <span className="mt-2 flex flex-wrap gap-2">
              <span className={cn("rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase", catChip)}>
                {form.category || "General"}
              </span>
              <span className={cn("rounded-md px-2 py-0.5 text-[0.65rem] uppercase", priChip)}>
                {priorityLabel(form.priority)}
              </span>
            </span>
          }
          trailing={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="border-[#ededed] bg-white font-semibold text-[#637381] hover:bg-[#f8f9fa]"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" className="font-semibold shadow-[0_6px_15px_rgba(36,37,38,0.08)]" onClick={submit}>
                Save
              </Button>
            </div>
          }
        />
        <DrawerBody className="bg-[#f7f7f7]">
          <div className="mx-auto max-w-lg space-y-4">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Title</span>
              <Input
                className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                value={form.title}
                onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value.slice(0, 200) } : f))}
                placeholder="Optional headline"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Message</span>
              <Textarea
                className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, message: e.target.value.slice(0, 2000) } : f))
                }
                placeholder="What should the household know?"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Category</span>
                <Select
                  className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                  value={
                    categorySelectOptions.includes(form.category)
                      ? form.category
                      : (categorySelectOptions[0] ?? form.category)
                  }
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categorySelectOptions.map((lab) => (
                    <option key={lab} value={lab}>
                      {lab}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Priority</span>
                <Select
                  className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, priority: e.target.value as MessageBoardPriority } : f,
                    )
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {priorityLabel(p)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-[#ededed] bg-white px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#FE9F43]/35 focus-within:ring-offset-2 focus-within:ring-offset-[#f7f7f7]">
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-[#F26522] focus-visible:outline-none"
                checked={form.pinned}
                onChange={(e) => setForm((f) => (f ? { ...f, pinned: e.target.checked } : f))}
              />
              <span className="text-sm font-medium text-[#1f1f1f]">Pin to top</span>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Author</span>
              <Select
                className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                value={form.authorMemberId ?? ""}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, authorMemberId: e.target.value || undefined } : f,
                  )
                }
              >
                <option value="">Anonymous</option>
                {membersForAssignmentSelect(familyMembers, form.authorMemberId).map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberFullName(m)}
                  </option>
                ))}
              </Select>
            </label>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                Related members
              </span>
              <div className="flex flex-wrap gap-2">
                {relatedPool.map((m) => {
                  const on = (form.relatedMemberIds ?? []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleRelated(m.id)}
                      className={cn(
                        "min-h-10 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
                        on
                          ? "border-[#FE9F43]/55 bg-[#FEF0E9] text-[#1f1f1f]"
                          : "border-[#ededed] bg-white text-[#4B5563] hover:bg-[#f8f9fa]",
                      )}
                    >
                      {getMemberFullName(m)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                  Starts at (optional)
                </span>
                <Input
                  className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                  type="datetime-local"
                  value={toLocalInput(form.startsAt)}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            startsAt: fromLocalInput(e.target.value),
                          }
                        : f,
                    )
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                  Expires at (optional)
                </span>
                <Input
                  className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
                  type="datetime-local"
                  value={toLocalInput(form.expiresAt)}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            expiresAt: fromLocalInput(e.target.value),
                          }
                        : f,
                    )
                  }
                />
              </label>
            </div>
            {onDelete && mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                className="font-semibold text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  if (window.confirm("Remove this message from the board?")) {
                    onDelete(form.id);
                    onClose();
                  }
                }}
              >
                Delete message
              </Button>
            ) : null}
          </div>
        </DrawerBody>
      </DrawerPanel>
    </>
  );
}

function selectOptionsWithCurrent(options: string[], current?: string): string[] {
  const c = current?.trim();
  if (!c || options.includes(c)) {
    return [...options];
  }
  return [c, ...options];
}

function displayTitle(form: MessageBoardItem): string {
  const t = form.title.trim();
  if (t) {
    return t;
  }
  return "New message";
}

function toLocalInput(iso?: string): string {
  if (!iso?.trim()) {
    return "";
  }
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | undefined {
  if (!local.trim()) {
    return undefined;
  }
  const d = new Date(local);
  if (!Number.isFinite(d.getTime())) {
    return undefined;
  }
  return d.toISOString();
}
