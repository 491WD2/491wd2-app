import { useMemo, useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import {
  CANONICAL_HOUSEHOLD_ROSTER_NAMES,
  type FamilyData,
  type MessageBoardItem,
  type PantryItem,
  type PlannerEvent,
  type Task,
  type TaskFrequency,
} from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { createActivity } from "../lib/activity";
import {
  dueDateForWhenPreset,
  patchTaskAfterChoreMarkedDone,
  type ChoreWhenPreset,
} from "../lib/choreTrackerUtils";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { ownerLabelForAssignment } from "../lib/memberAssignment";
import { cn, getMemberFullName } from "../lib/utils";
import { findDuplicateShoppingIndex } from "../services/rulesEngine";
import { WorkflowTypeSelector } from "../components/wizard/WorkflowTypeSelector";
import { createShoppingItemFromName } from "./shopping/shoppingUtils";
import {
  getQuickActionPreviewText,
  parseQuickActionSearchParams,
  type QuickAction,
  validateQuickAction,
} from "../services/quickActions";
import { createEmptyMessageBoardItem, displayMessageTitle } from "../lib/messageBoardUtils";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const SM_INPUT =
  "min-h-11 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const PANEL_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-6";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";

type QuickAddPageProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  locationSearch: string;
  navigateWithinApp: (href: string) => void;
  onOpenDashboard: () => void;
};

function moduleEnabled(
  key: keyof NonNullable<FamilyData["adminSettings"]["moduleVisibility"]>,
  data: FamilyData,
) {
  return data.adminSettings.moduleVisibility?.[key] !== false;
}

export function QuickAddPage({
  data,
  setData,
  locationSearch,
  navigateWithinApp,
  onOpenDashboard,
}: QuickAddPageProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const searchParams = useMemo(() => {
    const q = locationSearch.startsWith("?") ? locationSearch.slice(1) : locationSearch;
    return new URLSearchParams(q);
  }, [locationSearch]);

  const parsed = useMemo(
    () => parseQuickActionSearchParams(searchParams),
    [searchParams],
  );

  const initialAction: QuickAction | null = parsed.ok ? parsed.action : null;
  const initialType = initialAction?.type ?? null;

  const [mainField, setMainField] = useState(() => {
    if (!initialAction) {
      return "";
    }
    if (initialAction.type === "grocery") {
      return initialAction.name;
    }
    if (initialAction.type === "task") {
      return initialAction.title;
    }
    if (initialAction.type === "note") {
      return initialAction.title;
    }
    if (initialAction.type === "message") {
      return initialAction.title;
    }
    if (initialAction.type === "chore") {
      return initialAction.title;
    }
    if (initialAction.type === "pantry") {
      return initialAction.name;
    }
    return initialAction.title;
  });

  const [eventDate, setEventDate] = useState(
    initialAction?.type === "event" ? (initialAction.date ?? "") : "",
  );
  const [eventTime, setEventTime] = useState(
    initialAction?.type === "event" ? (initialAction.time ?? "") : "",
  );
  const [messageBody, setMessageBody] = useState(
    initialAction?.type === "message" ? (initialAction.body ?? "") : "",
  );

  const [choreAssignee, setChoreAssignee] = useState("__family__");
  const [choreWhen, setChoreWhen] = useState<ChoreWhenPreset>("today");
  const [choreCustomDate, setChoreCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [choreFrequency, setChoreFrequency] = useState<TaskFrequency>("weekly");
  const [choreStatusUi, setChoreStatusUi] = useState<"Not Started" | "In Progress" | "Done">(
    "Not Started",
  );
  const [choreNotes, setChoreNotes] = useState("");

  const sortedMembersForChore = useMemo(() => {
    const order = new Map(
      CANONICAL_HOUSEHOLD_ROSTER_NAMES.map((name, index) => [name.toLowerCase(), index]),
    );
    return data.familyMembers
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
  }, [data.familyMembers]);

  const choreDueResolved = useMemo(() => {
    if (initialType !== "chore") {
      return "";
    }
    return dueDateForWhenPreset(
      choreWhen,
      todayIso,
      choreWhen === "custom" ? choreCustomDate : todayIso,
    );
  }, [initialType, choreWhen, choreCustomDate, todayIso]);

  const draftAction: QuickAction | null = useMemo(() => {
    if (!initialType) {
      return null;
    }
    const mf = mainField.trim();
    switch (initialType) {
      case "grocery":
        return { type: "grocery", name: mf };
      case "task":
        return { type: "task", title: mf };
      case "note":
        return { type: "note", title: mf };
      case "chore":
        return { type: "chore", title: mf };
      case "message":
        return { type: "message", title: mf, body: messageBody.trim() || undefined };
      case "pantry":
        return { type: "pantry", name: mf };
      case "event":
        return {
          type: "event",
          title: mf,
          date: eventDate.trim() || undefined,
          time: eventTime.trim() || undefined,
        };
      default:
        return null;
    }
  }, [initialType, mainField, eventDate, eventTime, messageBody]);

  const parseErrors = parsed.ok ? [] : parsed.errors;
  const validationErrors = draftAction ? validateQuickAction(draftAction) : [];
  const allErrors = [...parseErrors, ...validationErrors];

  const previewText = draftAction ? getQuickActionPreviewText(draftAction) : "";
  const saveAllowed =
    draftAction &&
    allErrors.length === 0 &&
    (initialType === "grocery"
      ? moduleEnabled("shopping", data)
      : initialType === "task"
        ? moduleEnabled("tasks", data)
        : initialType === "chore"
          ? moduleEnabled("tasks", data)
          : initialType === "event"
            ? moduleEnabled("calendar", data)
            : initialType === "note"
              ? moduleEnabled("docs", data)
              : initialType === "message"
                ? true
                : initialType === "pantry"
                  ? moduleEnabled("pantry", data)
                  : false);

  const moduleBlockMessage =
    draftAction?.type === "grocery" && !moduleEnabled("shopping", data)
      ? "Shopping is hidden in Settings. Turn it on to save groceries from a quick link."
      : draftAction?.type === "task" && !moduleEnabled("tasks", data)
        ? "Cleaning is hidden in Settings. Turn the module on to save this item."
        : draftAction?.type === "event" && !moduleEnabled("calendar", data)
          ? "Calendar is hidden in Settings. Turn it on to save activities from a quick link."
          : draftAction?.type === "note" && !moduleEnabled("docs", data)
            ? "Notes are hidden in Settings. Turn the module on to save notes."
            : draftAction?.type === "chore" && !moduleEnabled("tasks", data)
              ? "Cleaning is hidden in Settings. Turn the module on to save chores."
              : draftAction?.type === "pantry" && !moduleEnabled("pantry", data)
                ? "Pantry is hidden in Settings. Turn the module on to add inventory."
                : null;

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draftAction || !saveAllowed) {
      return;
    }
    const v = validateQuickAction(draftAction);
    if (v.length > 0) {
      return;
    }

    switch (draftAction.type) {
      case "grocery": {
        const item = createShoppingItemFromName(draftAction.name);
        setData((current) => {
          const dup = findDuplicateShoppingIndex(current.shopping, draftAction.name, true);
          if (dup >= 0) {
            const row = current.shopping[dup]!;
            const q = parseInt(String(row.quantity), 10);
            const nextQ = Number.isFinite(q) ? String(q + 1) : row.quantity;
            const now = new Date().toISOString();
            const merged = current.shopping.map((s, i) =>
              i === dup ? { ...s, quantity: nextQ, updatedAt: now } : s,
            );
            return createActivity(
              { ...current, shopping: merged },
              {
                type: "updated",
                entityType: "shoppingItem",
                entityId: row.id,
                entityTitle: row.name,
                message: `Merged duplicate grocery: ${row.name} (qty ${nextQ}).`,
              },
            );
          }
          return createActivity(
            {
              ...current,
              shopping: [...current.shopping, item],
            },
            {
              type: "created",
              entityType: "shoppingItem",
              entityId: item.id,
              entityTitle: item.name,
              message: `Quick add: grocery ${item.name}.`,
            },
          );
        });
        navigateWithinApp("/shopping");
        break;
      }
      case "task": {
        const taskId = crypto.randomUUID();
        const dueDate = new Date().toISOString().slice(0, 10);
        const task: Task = {
          id: taskId,
          title: draftAction.title,
          description: "",
          owner: "Family",
          status: "Not Started",
          priority: "Medium",
          dueDate,
          dueTime: "",
          type: "task",
          frequency: "one-time",
          lastCompletedDate: "",
          nextDueDate: dueDate,
          assignedMemberId: "",
          zone: "Kitchen",
          room: "",
          category: "cleaning",
          notes: "",
          checklist: [],
          rewardPoints: 0,
          requiresVerification: false,
          requiresProof: false,
          referenceMedia: [],
          completionProof: [],
          isBrainDump: false,
          source: "manual",
          sourceSystem: "quick-add",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setData((current) =>
          createActivity(
            {
              ...current,
              tasks: [...current.tasks, task],
            },
            {
              type: "created",
              entityType: "task",
              entityId: taskId,
              entityTitle: task.title,
              message: `Quick add: task ${task.title}.`,
            },
          ),
        );
        navigateWithinApp("/tasks");
        break;
      }
      case "chore": {
        const taskId = crypto.randomUUID();
        const dueResolved = dueDateForWhenPreset(
          choreWhen,
          todayIso,
          choreWhen === "custom" ? choreCustomDate : todayIso,
        );
        const assignedRaw = choreAssignee === "__family__" ? "" : choreAssignee;
        const owner = ownerLabelForAssignment(data.familyMembers, assignedRaw, "Family");
        const sessionMemberId = resolveSessionMemberIdForUi(data);
        const doneNow = choreStatusUi === "Done";
        const createdAt = new Date().toISOString();
        const completionBy = sessionMemberId || assignedRaw || undefined;

        const task: Task = doneNow
          ? (() => {
              const patch = patchTaskAfterChoreMarkedDone(
                choreFrequency,
                todayIso,
                createdAt,
                completionBy,
                dueResolved,
                dueResolved,
              );
              return {
                id: taskId,
                title: draftAction.title.trim(),
                description: "",
                owner,
                priority: "Medium",
                dueDate: patch.dueDate ?? dueResolved,
                dueTime: "",
                type: "chore" as const,
                frequency: choreFrequency,
                lastCompletedDate: patch.lastCompletedDate ?? "",
                nextDueDate: patch.nextDueDate ?? dueResolved,
                status: patch.status,
                assignedMemberId: assignedRaw,
                zone: "Kitchen",
                room: "",
                category: "cleaning",
                notes: choreNotes.trim(),
                checklist: [],
                rewardPoints: 0,
                requiresVerification: false,
                requiresProof: false,
                referenceMedia: [],
                completionProof: [],
                isBrainDump: false,
                source: "manual",
                sourceSystem: "quick-add",
                createdAt,
                updatedAt: createdAt,
                lastCompletedAt: patch.lastCompletedAt,
                lastCompletedByMemberId: patch.lastCompletedByMemberId,
              };
            })()
          : {
              id: taskId,
              title: draftAction.title.trim(),
              description: "",
              owner,
              status: choreStatusUi === "In Progress" ? "In Progress" : "Not Started",
              priority: "Medium",
              dueDate: dueResolved,
              dueTime: "",
              type: "chore",
              frequency: choreFrequency,
              lastCompletedDate: "",
              nextDueDate: dueResolved,
              assignedMemberId: assignedRaw,
              zone: "Kitchen",
              room: "",
              category: "cleaning",
              notes: choreNotes.trim(),
              checklist: [],
              rewardPoints: 0,
              requiresVerification: false,
              requiresProof: false,
              referenceMedia: [],
              completionProof: [],
              isBrainDump: false,
              source: "manual",
              sourceSystem: "quick-add",
              createdAt,
              updatedAt: createdAt,
            };
        setData((current) =>
          createActivity(
            {
              ...current,
              tasks: [...current.tasks, task],
            },
            {
              type: "created",
              entityType: "chore",
              entityId: taskId,
              entityTitle: task.title,
              message: `Quick add: chore ${task.title}.`,
            },
          ),
        );
        navigateWithinApp("/tasks#chore-tracker");
        break;
      }
      case "message": {
        const now = new Date().toISOString();
        const bodyText = (draftAction.body?.trim() || draftAction.title).trim();
        const item: MessageBoardItem = {
          ...createEmptyMessageBoardItem({
            authorMemberId: data.adminSettings.activePreferencesMemberId ?? undefined,
          }),
          title: draftAction.title.trim(),
          message: bodyText,
          updatedAt: now,
          createdAt: now,
        };
        setData((current) =>
          createActivity(
            {
              ...current,
              messageBoard: [item, ...current.messageBoard],
            },
            {
              type: "created",
              entityType: "messageBoard",
              entityId: item.id,
              entityTitle: displayMessageTitle(item),
              message: `Quick add: message ${displayMessageTitle(item)}.`,
            },
          ),
        );
        navigateWithinApp("/messages");
        break;
      }
      case "pantry": {
        const now = new Date().toISOString();
        const name = draftAction.name.trim() || "New inventory item";
        const item: PantryItem = {
          id: crypto.randomUUID(),
          name,
          quantity: "1",
          unit: "",
          category: "Grocery",
          storageArea: "Pantry",
          location: "Pantry",
          barcode: "",
          brand: "",
          productImageUrl: "",
          locationDetail: "",
          customLocationName: "",
          kitchenLocationDetail: "",
          pantryLocationNote: "",
          coldLocationDetail: "",
          pantryWall: "Wall 1",
          pantryShelf: "Shelf 1",
          wall: "Wall 1",
          shelf: "Shelf 1",
          status: "Stocked",
          groceryItemId: "",
          expiryDate: "",
          bestByDate: "",
          notes: "",
          isStaple: false,
          minQuantity: "",
          tags: [],
          source: "manual",
          lastUpdated: now,
          createdAt: now,
        };
        setData((current) =>
          createActivity(
            {
              ...current,
              pantry: [...current.pantry, item],
            },
            {
              type: "created",
              entityType: "pantryItem",
              entityId: item.id,
              entityTitle: item.name,
              message: `Quick add: pantry ${item.name}.`,
            },
          ),
        );
        navigateWithinApp("/pantry?tab=inventory");
        break;
      }
      case "event": {
        const eventId = crypto.randomUUID();
        const date = draftAction.date ?? new Date().toISOString().slice(0, 10);
        const time = draftAction.time ?? "09:00";
        const plannerEvent: PlannerEvent = {
          id: eventId,
          title: draftAction.title,
          date,
          time,
          category: "Family",
          assignedMemberId: "",
          assignedPerson: "Family",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setData((current) =>
          createActivity(
            {
              ...current,
              planner: [...current.planner, plannerEvent],
            },
            {
              type: "created",
              entityType: "planner",
              entityId: eventId,
              entityTitle: plannerEvent.title,
              message: `Quick add: event ${plannerEvent.title}.`,
            },
          ),
        );
        navigateWithinApp("/calendar");
        break;
      }
      case "note": {
        const now = new Date().toISOString();
        const docId = crypto.randomUUID();
        setData((current) =>
          createActivity(
            {
              ...current,
              docs: [
                ...current.docs,
                {
                  id: docId,
                  title: draftAction.title,
                  content: "",
                  category: "other",
                  tags: [],
                  pinned: false,
                  relatedMemberIds: [],
                  relatedProjectId: "",
                  visibility: "household",
                  createdAt: now,
                  updatedAt: now,
                  source: "manual",
                  sourceSystem: "quick-add",
                  body: "",
                },
              ],
            },
            {
              type: "created",
              entityType: "doc",
              entityId: docId,
              entityTitle: draftAction.title,
              message: `Quick add: note ${draftAction.title}.`,
            },
          ),
        );
        navigateWithinApp("/");
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn("pb-8 px-[15px] pt-0 sm:px-[30px]", DS_MAIN_COLUMN)}
        tone="light"
      >
      <ModuleWorkspaceHeader
        description="Add something for the household in a few taps. Links can be bookmarked — keep them generic."
        eyebrow="Shortcuts"
        title="Quick Add"
        tone="light"
      />

      <div className={cn("mt-6 space-y-4", PANEL_SMARTHR)}>
        {!initialType ? (
          <>
            {parseErrors.length > 0 ? (
              <ul className="mb-4 list-inside list-disc rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                {parseErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
            <WorkflowTypeSelector
              onPickType={(type) => {
                const href =
                  type === "grocery"
                    ? "/quick-add?type=grocery&name="
                    : type === "task"
                      ? "/quick-add?type=task&title="
                      : type === "chore"
                        ? "/quick-add?type=chore&title="
                        : type === "message"
                          ? "/quick-add?type=message&title="
                          : type === "pantry"
                            ? "/quick-add?type=pantry&name="
                            : type === "event"
                              ? "/quick-add?type=event&title="
                              : "/quick-add?type=note&title=";
                navigateWithinApp(href);
              }}
              onScanPantry={() => navigateWithinApp("/pantry?tab=add-item")}
            />
            <Button className="mt-6 min-h-12 w-full sm:w-auto" onClick={onOpenDashboard} variant="secondary" type="button">
              Back to home
            </Button>
            <p className="mt-4 text-xs leading-relaxed text-[#575757]">
              Shortcut URLs still work —{" "}
              <span className="rounded border border-[#ededed] bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[0.65rem] text-[#1f1f1f]">
                /quick-add?type=grocery&amp;name=Milk
              </span>
            </p>
          </>
        ) : (
          <form className="space-y-4 text-[#1f1f1f]" onSubmit={handleSave}>
            <p className="text-sm text-[#575757]">
              {initialType === "chore" && choreDueResolved ? (
                <>
                  Add chore:{" "}
                  <span className="font-semibold text-[#1f1f1f]">
                    {mainField.trim() || "(name needed)"}
                  </span>
                  {" — "}due {choreDueResolved}
                  {" · "}
                  {ownerLabelForAssignment(
                    data.familyMembers,
                    choreAssignee === "__family__" ? undefined : choreAssignee,
                  )}
                </>
              ) : (
                previewText
              )}
            </p>

            {allErrors.length > 0 ? (
              <ul className="list-inside list-disc rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                {allErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}

            {moduleBlockMessage ? (
              <p className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {moduleBlockMessage}
              </p>
            ) : null}

            <label className="block space-y-1">
              <span className={SM_LABEL}>
                {initialType === "grocery"
                  ? "Item name"
                  : initialType === "pantry"
                    ? "Pantry item name"
                    : initialType === "event"
                      ? "Event title"
                      : initialType === "chore"
                        ? "Chore name"
                        : "Title"}
              </span>
              <Input
                className={SM_INPUT}
                onChange={(e) => setMainField(e.target.value)}
                value={mainField}
              />
            </label>

            {initialType === "chore" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className={SM_LABEL}>Assigned to</span>
                  <Select
                    className={SM_INPUT}
                    value={choreAssignee}
                    onChange={(e) => setChoreAssignee(e.target.value)}
                  >
                    <option value="__family__">Family</option>
                    {sortedMembersForChore.map((m) => (
                      <option key={m.id} value={m.id}>
                        {getMemberFullName(m)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block space-y-1">
                  <span className={SM_LABEL}>When</span>
                  <Select
                    className={SM_INPUT}
                    value={choreWhen}
                    onChange={(e) => setChoreWhen(e.target.value as ChoreWhenPreset)}
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This week</option>
                    <option value="custom">Custom date</option>
                  </Select>
                </label>
                {choreWhen === "custom" ? (
                  <label className="block space-y-1 sm:col-span-2">
                    <span className={SM_LABEL}>Custom date</span>
                    <Input
                      type="date"
                      className={SM_INPUT}
                      value={choreCustomDate.slice(0, 10)}
                      onChange={(e) => setChoreCustomDate(e.target.value)}
                    />
                  </label>
                ) : null}
                <label className="block space-y-1">
                  <span className={SM_LABEL}>How often</span>
                  <Select
                    className={SM_INPUT}
                    value={choreFrequency}
                    onChange={(e) => setChoreFrequency(e.target.value as TaskFrequency)}
                  >
                    <option value="one-time">One time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="as-needed">As needed</option>
                  </Select>
                </label>
                <label className="block space-y-1">
                  <span className={SM_LABEL}>Status</span>
                  <Select
                    className={SM_INPUT}
                    value={choreStatusUi}
                    onChange={(e) =>
                      setChoreStatusUi(e.target.value as "Not Started" | "In Progress" | "Done")
                    }
                  >
                    <option value="Not Started">Not started</option>
                    <option value="In Progress">In progress</option>
                    <option value="Done">Done</option>
                  </Select>
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className={SM_LABEL}>Notes</span>
                  <Textarea
                    className={cn(SM_INPUT, "min-h-[4.5rem] resize-y py-3")}
                    value={choreNotes}
                    onChange={(e) => setChoreNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
            ) : null}

            {initialType === "message" ? (
              <label className="block space-y-1">
                <span className={SM_LABEL}>Message (optional — defaults to title)</span>
                <Textarea
                  className={cn(SM_INPUT, "min-h-[6rem] resize-y py-3")}
                  onChange={(e) => setMessageBody(e.target.value)}
                  value={messageBody}
                />
              </label>
            ) : null}

            {initialType === "event" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className={SM_LABEL}>
                    Date (YYYY-MM-DD)
                  </span>
                  <Input
                    className={SM_INPUT}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder={new Date().toISOString().slice(0, 10)}
                    type="date"
                    value={eventDate}
                  />
                </label>
                <label className="space-y-1">
                  <span className={SM_LABEL}>
                    Time (optional)
                  </span>
                  <Input
                    className={SM_INPUT}
                    onChange={(e) => setEventTime(e.target.value)}
                    type="time"
                    value={eventTime}
                  />
                </label>
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-[#575757]">
              Do not put private medical details, emergency contacts, passwords, or tokens in the
              URL. Anyone with the link can open this screen on this device.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                disabled={!saveAllowed || allErrors.length > 0}
                type="submit"
                variant="primary"
              >
                Save to household
              </Button>
              <Button
                className="border-[#ededed] bg-white font-semibold text-[#575757] shadow-sm hover:bg-[#f8f9fa]"
                onClick={onOpenDashboard}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
      </WorkspacePageShell>
    </div>
  );
}
