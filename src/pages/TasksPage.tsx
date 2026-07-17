import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ListChecks,
  Plus,
  Search,
  Table2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useActiveDashboardViewMemberId } from "../hooks/useActiveDashboardViewMemberId";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import {
  taskTypes,
  type AdminSettings,
  type FamilyMember,
  type Task,
  type TaskCompletionProof,
  type TaskFrequency,
  type TaskReferenceMedia,
  type TaskStatus,
  type TaskType,
} from "../data/familyData";
import {
  CleaningHubTiles,
  CleaningPlaybookDrawer,
} from "../components/cleaning/CleaningPlaybook";
import { SimpleChoreTracker } from "../components/cleaning/SimpleChoreTracker";
import { KitchenHubSection } from "../components/kitchen/KitchenHubSection";
import { KitchenChecklistCleaningSection } from "../components/kitchen/KitchenChecklistSurfaces";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Field";
import { createActivity } from "../lib/activity";
import {
  getTaskFrequencyChipClass,
  getTaskPriorityChipClass,
  getTaskStatusChipClass,
} from "../lib/colorCoding";
import { formatShortDate, getMemberFullName, getNextDueDate, cn } from "../lib/utils";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerHeader,
  DrawerPanel,
} from "../components/workspace/DrawerShell";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import {
  ModuleActionBar,
  ModuleWorkspaceHeader,
  WorkspaceFilterBar,
  WorkspacePageShell,
  WorkspaceRoutedSection,
  WorkspaceTableWrap,
  workspaceFormSectionClassName,
  workspaceTableClassName,
} from "../components/workspace/ModuleWorkspace";
import type { PageProps } from "./pageTypes";
import {
  getTaskCategories,
  getTaskFrequencies,
  getTaskPriorities,
  getTaskStatuses,
  getTaskZones,
  selectOptionsWithCurrent,
} from "../lib/customization";
import {
  membersForAssignmentSelect,
  membersReferencedByTasks,
  ownerLabelForAssignment,
} from "../lib/memberAssignment";
import "../components/cards/kiosk.css";
import "../styles/guided-kiosk.css";

type WorkspaceView =
  | "kitchen"
  | "rooms"
  | "list"
  | "tracker"
  | "board"
  | "person"
  | "day"
  | "table";

type TaskKioskFlow = "add" | "find" | "complete" | "assign" | "today" | "overdue" | "unassigned";

/** SmartHR — Cleaning workspace */
const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const ACTION_BAR_SMARTHR =
  "!rounded-[8px] !border-[#ededed] !shadow-[0_1px_1px_rgba(0,0,0,0.12)] ring-0";
const DETAILS_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-1 text-[#1f1f1f]";
const FILTER_SHELL =
  "!rounded-[8px] !border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.12)] ring-0";
const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#FE9F43]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";
const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const segmentInactiveLight = "text-[#637381] hover:bg-white hover:text-[#1f1f1f]";
const segmentActiveLight =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm";

const cleaningWorkspaceTabs: { id: WorkspaceView; label: string }[] = [
  { id: "kitchen", label: "Kitchen" },
  { id: "rooms", label: "Cleaning Hub" },
  { id: "list", label: "List" },
  { id: "tracker", label: "Chore tracker" },
  { id: "board", label: "Board" },
  { id: "person", label: "By member" },
  { id: "day", label: "By day" },
  { id: "table", label: "Table" },
];

export function TasksPage({
  data,
  setData,
  onOpenDashboard,
  navigateWithinApp,
  restrictChildNavigation,
}: PageProps) {
  const admin = data.adminSettings;
  const zoneOptions = getTaskZones(admin);
  const taskStatusOptions = getTaskStatuses(admin);

  const [brainDumpText, setBrainDumpText] = useState("");
  const [hasEnteredTasks, setHasEnteredTasks] = useState(true);
  const [activeView, setActiveView] = useState<WorkspaceView>("rooms");
  const dashboardViewMemberId = useActiveDashboardViewMemberId(activeView);
  const [searchText, setSearchText] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recurringFilter, setRecurringFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showFullWorkspace, setShowFullWorkspace] = useState(true);
  const [taskFlow, setTaskFlow] = useState<TaskKioskFlow | null>(null);
  const [taskFlowSearch, setTaskFlowSearch] = useState("");
  const [taskFlowSelectedId, setTaskFlowSelectedId] = useState("");
  const [taskFlowTitle, setTaskFlowTitle] = useState("");
  const [taskFlowType, setTaskFlowType] = useState<TaskType>("task");
  const [taskFlowAssigneeId, setTaskFlowAssigneeId] = useState("");
  const [taskFlowComplete, setTaskFlowComplete] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    function applyCleaningHash() {
      const raw = window.location.hash.slice(1).toLowerCase();
      if (raw === "kitchen") {
        setActiveView("kitchen");
      }
      if (raw === "cleaning-hub" || raw === "cleaning" || raw === "rooms") {
        setActiveView("rooms");
      }
      if (raw === "chore-tracker" || raw === "tracker") {
        setActiveView("tracker");
      }
    }
    applyCleaningHash();
    window.addEventListener("hashchange", applyCleaningHash);
    return () => window.removeEventListener("hashchange", applyCleaningHash);
  }, []);
  const openTasks = data.tasks.filter((task) => !isTaskComplete(task));
  const chores = data.tasks.filter((task) => task.type === "chore");
  const todayItems = openTasks.filter((task) => getTaskDueDate(task) === today);
  const overdueItems = openTasks.filter((task) => getTaskDueDate(task) < today);
  const thisWeekItems = openTasks.filter((task) =>
    isWithinNextDays(getTaskDueDate(task), today, 7),
  );
  const upcomingItems = openTasks
    .filter((task) => getTaskDueDate(task) > today)
    .filter((task) => isWithinNextDays(getTaskDueDate(task), today, 7));
  const brainDumpItems = data.tasks.filter((task) => task.isBrainDump);
  const unassignedItems = openTasks.filter((task) => !task.assignedMemberId);
  const taskPersonRoster = useMemo(
    () => membersReferencedByTasks(data.familyMembers, data.tasks),
    [data.familyMembers, data.tasks],
  );
  const tasksEntryMembers = useMemo(
    () =>
      data.familyMembers
        .filter((member) => member.status === "active" || member.status === "guest")
        .slice()
        .sort((a, b) => getMemberFullName(a).localeCompare(getMemberFullName(b))),
    [data.familyMembers],
  );
  const waitingReviewItems = data.tasks.filter((task) => task.status === "Waiting Review");
  const selectedTask = data.tasks.find((task) => task.id === selectedTaskId);
  const filteredTasks = data.tasks.filter((task) => {
    const query = searchText.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.zone ?? "").toLowerCase().includes(query) ||
      (task.category ?? "").toLowerCase().includes(query);
    const matchesPerson =
      personFilter === "all" ||
      (personFilter === "unassigned"
        ? !task.assignedMemberId
        : task.assignedMemberId === personFilter);
    const matchesZone = zoneFilter === "all" || (task.zone || "Custom Zone") === zoneFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesRecurring =
      recurringFilter === "all" ||
      (recurringFilter === "recurring"
        ? task.frequency !== "one-time"
        : task.frequency === "one-time");

    return matchesSearch && matchesPerson && matchesZone && matchesStatus && matchesRecurring;
  });
  const taskFlowSelectedTask = data.tasks.find((task) => task.id === taskFlowSelectedId);
  const taskFlowCandidates = useMemo(() => {
    const pool =
      taskFlow === "today"
        ? todayItems
        : taskFlow === "overdue"
          ? overdueItems
          : taskFlow === "unassigned"
            ? unassignedItems
        : taskFlow === "complete" || taskFlow === "assign"
          ? openTasks
          : data.tasks;
    const query = taskFlowSearch.trim().toLowerCase();
    return pool
      .filter((task) => {
        if (!query) {
          return true;
        }
        return (
          task.title.toLowerCase().includes(query) ||
          (task.zone ?? "").toLowerCase().includes(query) ||
          (task.category ?? "").toLowerCase().includes(query) ||
          (task.owner ?? "").toLowerCase().includes(query)
        );
      })
      .slice(0, 14);
  }, [data.tasks, openTasks, overdueItems, taskFlow, taskFlowSearch, todayItems, unassignedItems]);

  function addTask({
    title = "New household task",
    isBrainDump = false,
    type = "task",
    frequency = "one-time",
  }: {
    title?: string;
    isBrainDump?: boolean;
    type?: TaskType;
    frequency?: TaskFrequency;
  } = {}) {
    const taskId = crypto.randomUUID();
    const dueDate = new Date().toISOString().slice(0, 10);
    const task: Task = {
      id: taskId,
      title,
      description: "",
      owner: "Family",
      status: "Not Started",
      priority: "Medium",
      dueDate,
      dueTime: "",
      type,
      frequency: type === "chore" ? frequency : "one-time",
      lastCompletedDate: "",
      nextDueDate: dueDate,
      assignedMemberId: "",
      zone: isBrainDump ? "Admin" : "Kitchen",
      room: "",
      category: isBrainDump ? "brain dump" : "cleaning",
      notes: "",
      checklist: [],
      rewardPoints: 0,
      requiresVerification: false,
      requiresProof: false,
      referenceMedia: [],
      completionProof: [],
      isBrainDump,
      brainDumpType: isBrainDump ? "task" : undefined,
      source: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((current) => ({
      ...createActivity(current, {
        type: "created",
        entityType: type === "chore" ? "chore" : "task",
        entityId: taskId,
        entityTitle: task.title,
        message: `Created ${isBrainDump ? "brain dump item" : type}: ${task.title}.`,
      }),
      tasks: [...current.tasks, task],
    }));

    return taskId;
  }

  function addBrainDumpItem() {
    const title = brainDumpText.trim();

    if (!title) {
      return;
    }

    addTask({ title, isBrainDump: true });
    setBrainDumpText("");
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task,
      ),
    }));
  }

  function updateTaskWithActivity(
    task: Task,
    updates: Partial<Task>,
    message = `Updated task: ${task.title}.`,
  ) {
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
          entityType: task.type === "chore" ? "chore" : "task",
          entityId: task.id,
          entityTitle: task.title,
          memberId: task.assignedMemberId || undefined,
          message,
        },
      ),
    );
  }

  function completeTask(task: Task) {
    const completedDate = new Date().toISOString().slice(0, 10);

    if (task.type === "chore") {
      setData((current) =>
        createActivity(
          {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === task.id
                ? {
                    ...item,
                    status: "Not Started",
                    isBrainDump: false,
                    lastCompletedDate: completedDate,
                    nextDueDate: getNextDueDate(completedDate, task.frequency),
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          },
          {
            type: "completed",
            entityType: "chore",
            entityId: task.id,
            entityTitle: task.title,
            memberId: task.assignedMemberId || undefined,
            message: `Completed chore: ${task.title}.`,
          },
        ),
      );
      return;
    }

    updateTaskWithActivity(
      task,
      {
        status: task.requiresVerification ? "Waiting Review" : "Done",
        isBrainDump: false,
        lastCompletedDate: completedDate,
      },
      task.requiresVerification
        ? `Sent task for review: ${task.title}.`
        : `Completed task: ${task.title}.`,
    );
  }

  function organizeBrainDumpItem(task: Task) {
    updateTask(task.id, {
      isBrainDump: false,
      type: task.brainDumpType === "chore" ? "chore" : "task",
      frequency: task.brainDumpType === "chore" ? task.frequency : "one-time",
      category: task.brainDumpType ?? task.category,
    });
  }

  function resetTaskFlow() {
    setTaskFlow(null);
    setTaskFlowSearch("");
    setTaskFlowSelectedId("");
    setTaskFlowTitle("");
    setTaskFlowType("task");
    setTaskFlowAssigneeId("");
  }

  function startTaskFlow(flow: TaskKioskFlow) {
    setTaskFlowComplete(null);
    setTaskFlow(flow);
    setTaskFlowSearch("");
    setTaskFlowSelectedId("");
    setTaskFlowTitle("");
    setTaskFlowType(flow === "add" ? "task" : taskFlowType);
    setTaskFlowAssigneeId("");
  }

  function createTaskFromFlow() {
    const title = taskFlowTitle.trim() || (taskFlowType === "chore" ? "New cleaning chore" : "New household task");
    const taskId = addTask({
      title,
      type: taskFlowType,
      frequency: taskFlowType === "chore" ? "weekly" : "one-time",
    });
    setTaskFlowComplete(`Created ${title}.`);
    resetTaskFlow();
    setSelectedTaskId(taskId);
  }

  function assignTaskFromFlow(task: Task) {
    updateTaskWithActivity(
      task,
      { assignedMemberId: taskFlowAssigneeId },
      `Assigned task: ${task.title}.`,
    );
    const member = data.familyMembers.find((item) => item.id === taskFlowAssigneeId);
    setTaskFlowComplete(
      member
        ? `${task.title} was assigned to ${getMemberFullName(member)}.`
        : `${task.title} was moved to unassigned.`,
    );
    resetTaskFlow();
  }

  function enterTasks(memberId: string | null) {
    setPersonFilter(memberId ?? "all");
    setActiveView(memberId ? "person" : "list");
    setHasEnteredTasks(true);
  }

  function renderTaskFlowSheet() {
    if (!taskFlow) {
      return null;
    }

    const title =
      taskFlow === "add"
        ? "Add a task"
        : taskFlow === "find"
          ? "Find a task"
          : taskFlow === "complete"
            ? "Mark a task done"
            : taskFlow === "assign" || taskFlow === "unassigned"
              ? "Assign a task"
              : taskFlow === "overdue"
                ? "Overdue chores"
                : "Pick a chore for today";

    const helperText =
      taskFlow === "add"
        ? "Add the job in plain language. You can fine-tune room, person, and notes next."
        : taskFlow === "complete"
          ? "Pick the chore that was finished, then confirm it is done."
          : taskFlow === "assign" || taskFlow === "unassigned"
            ? "Pick the task first, then choose who should own it."
            : taskFlow === "overdue"
              ? "Start here when the house feels behind. Clear one overdue item at a time."
              : taskFlow === "today"
                ? "These are the chores due today. Pick one to open or finish."
                : "Search by chore name, room, zone, or person.";

    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={resetTaskFlow}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tasks-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Cleaning station</p>
              <h2 id="tasks-flow-title">{title}</h2>
              <p>{helperText}</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close cleaning flow"
              onClick={resetTaskFlow}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {taskFlow === "add" ? (
            <div className="wd-guided-kiosk__stack">
              <label className="wd-guided-kiosk__field">
                <span>What should be done?</span>
                <input
                  value={taskFlowTitle}
                  onChange={(event) => setTaskFlowTitle(event.target.value)}
                  placeholder="Example: Wipe kitchen counters"
                  autoFocus
                />
              </label>
              <div className="wd-guided-kiosk__choice-row" role="radiogroup" aria-label="Task type">
                {taskTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={
                      taskFlowType === type
                        ? "wd-guided-kiosk__pill wd-guided-kiosk__pill--active"
                        : "wd-guided-kiosk__pill"
                    }
                    aria-pressed={taskFlowType === type}
                    onClick={() => setTaskFlowType(type)}
                  >
                    {type === "chore" ? "Cleaning chore" : "Task"}
                  </button>
                ))}
              </div>
              <button type="button" className="wd-guided-kiosk__primary" onClick={createTaskFromFlow}>
                Create and open details
              </button>
            </div>
          ) : !taskFlowSelectedTask ? (
            <div className="wd-guided-kiosk__stack">
              <label className="wd-guided-kiosk__search">
                <Search className="h-4 w-4" aria-hidden />
                <input
                  value={taskFlowSearch}
                  onChange={(event) => setTaskFlowSearch(event.target.value)}
                  placeholder="Search task, room, zone..."
                  autoFocus
                />
              </label>
              <div className="wd-guided-kiosk__chooser" role="listbox" aria-label="Choose task">
                {taskFlowCandidates.length === 0 ? (
                  <p className="wd-guided-kiosk__empty">No matching tasks. Try another search.</p>
                ) : (
                  taskFlowCandidates.map((task) => {
                    const assigned = data.familyMembers.find((member) => member.id === task.assignedMemberId);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className="wd-guided-kiosk__chooser-row"
                        role="option"
                        onClick={() => {
                          if (taskFlow === "find" || taskFlow === "today" || taskFlow === "overdue") {
                            resetTaskFlow();
                            setSelectedTaskId(task.id);
                            return;
                          }
                          setTaskFlowSelectedId(task.id);
                        }}
                      >
                        <span>
                          <strong>{task.title}</strong>
                          <small>
                            {task.zone || "Household"} · {assigned ? getMemberFullName(assigned) : "Unassigned"} · {task.status}
                          </small>
                        </span>
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : taskFlow === "complete" ? (
            <div className="wd-guided-kiosk__confirm">
              <TaskFlowSummary task={taskFlowSelectedTask} members={data.familyMembers} />
              <div className="wd-guided-kiosk__actions">
                <button type="button" className="wd-guided-kiosk__secondary" onClick={() => setTaskFlowSelectedId("")}>
                  Pick another
                </button>
                <button
                  type="button"
                  className="wd-guided-kiosk__primary"
                  onClick={() => {
                    completeTask(taskFlowSelectedTask);
                    setTaskFlowComplete(`${taskFlowSelectedTask.title} was marked done.`);
                    resetTaskFlow();
                  }}
                >
                  Mark done
                </button>
              </div>
            </div>
          ) : (
            <div className="wd-guided-kiosk__confirm">
              <TaskFlowSummary task={taskFlowSelectedTask} members={data.familyMembers} />
              <label className="wd-guided-kiosk__field">
                <span>Assign to</span>
                <select
                  value={taskFlowAssigneeId}
                  onChange={(event) => setTaskFlowAssigneeId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {data.familyMembers
                    .filter((member) => member.status === "active" || member.status === "guest")
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {getMemberFullName(member)}
                      </option>
                    ))}
                </select>
              </label>
              <div className="wd-guided-kiosk__actions">
                <button type="button" className="wd-guided-kiosk__secondary" onClick={() => setTaskFlowSelectedId("")}>
                  Pick another
                </button>
                <button type="button" className="wd-guided-kiosk__primary" onClick={() => assignTaskFromFlow(taskFlowSelectedTask)}>
                  Save assignment
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  const taskDetailDrawer = selectedTask ? (
    <TaskDetailDrawer
      adminSettings={data.adminSettings}
      members={data.familyMembers}
      onClose={() => setSelectedTaskId("")}
      onComplete={completeTask}
      onUpdate={(updates, message) =>
        updateTaskWithActivity(selectedTask, updates, message)
      }
      task={selectedTask}
    />
  ) : null;

  if (!hasEnteredTasks) {
    return (
      <TasksOpeningScreen
        members={tasksEntryMembers}
        onContinueHousehold={() => enterTasks(null)}
        onSelectMember={(memberId) => enterTasks(memberId)}
      />
    );
  }

  if (!showFullWorkspace) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--tasks">
        <section className="wd-guided-kiosk__hero" aria-labelledby="tasks-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Cleaning station</p>
            <h1 id="tasks-kiosk-title">What do you want to do?</h1>
            <p>
              Pick one cleaning task. The next choice opens in a focused pop-up, then the next one.
            </p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{openTasks.length} open</span>
            <span>{todayItems.length} due today</span>
            <span>{overdueItems.length} overdue</span>
          </div>
        </section>

        {taskFlowComplete ? (
          <section className="wd-guided-kiosk__complete" role="status">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p>{taskFlowComplete}</p>
            <button type="button" onClick={() => setTaskFlowComplete(null)}>
              Start another
            </button>
          </section>
        ) : null}

        <section className="wd-guided-kiosk__actions-grid" aria-label="Cleaning actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => startTaskFlow("add")}>
            <span className="wd-guided-kiosk__action-icon"><Plus className="h-5 w-5" aria-hidden /></span>
            <span><strong>Add task</strong><small>Create, then open details</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("find")}>
            <span className="wd-guided-kiosk__action-icon"><Search className="h-5 w-5" aria-hidden /></span>
            <span><strong>Find task</strong><small>Search and open one task</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("complete")}>
            <span className="wd-guided-kiosk__action-icon"><CheckCircle2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Mark done</strong><small>Choose and confirm</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("overdue")}>
            <span className="wd-guided-kiosk__action-icon"><AlertTriangle className="h-5 w-5" aria-hidden /></span>
            <span><strong>Overdue chores</strong><small>Clear what is behind</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("unassigned")}>
            <span className="wd-guided-kiosk__action-icon"><UserPlus className="h-5 w-5" aria-hidden /></span>
            <span><strong>Unassigned tasks</strong><small>Give jobs to a person</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("assign")}>
            <span className="wd-guided-kiosk__action-icon"><UserPlus className="h-5 w-5" aria-hidden /></span>
            <span><strong>Assign task</strong><small>Pick task, then person</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => startTaskFlow("today")}>
            <span className="wd-guided-kiosk__action-icon"><ClipboardList className="h-5 w-5" aria-hidden /></span>
            <span><strong>Today’s chores</strong><small>Open a due task</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullWorkspace(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Advanced workspace</strong><small>Filters, tables, kitchen tools</small></span>
          </button>
        </section>

        {renderTaskFlowSheet()}
        {taskDetailDrawer}
      </div>
    );
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone="light"
      >
      <ModuleWorkspaceHeader
        description="Cleaning dashboard, kitchen duty, and household task views in one workspace."
        eyebrow="Cleaning & Tasks"
        metrics={[
          { label: "Open", value: openTasks.length },
          { label: "Due today", value: todayItems.length },
          { label: "Overdue", value: overdueItems.length },
        ]}
        title="Cleaning & Tasks"
        tone="light"
      />

      <ModuleActionBar className={ACTION_BAR_SMARTHR} tone="light">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              className={btnSecondaryLight}
              onClick={() => setShowFullWorkspace(false)}
              variant="secondary"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Kiosk station
            </Button>
            <Button
              className="text-[#637381] hover:bg-white"
              onClick={onOpenDashboard}
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
            <Button className={btnPrimaryOrange} onClick={() => addTask()} variant="primary">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            <Button
              className={btnSecondaryLight}
              onClick={() => setActiveView("kitchen")}
              variant="secondary"
              type="button"
            >
              <ClipboardList className="h-4 w-4" />
              Kitchen checklist
            </Button>
          </div>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer select-none py-3 text-sm font-semibold text-[#1f1f1f]">
              More — extras and layouts
            </summary>
            <div className="space-y-4 border-t border-[#ededed] pb-3 pt-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  className={btnSecondaryLight}
                  onClick={() =>
                    addTask({
                      title: "New cleaning chore",
                      type: "chore",
                      frequency: "weekly",
                    })
                  }
                  variant="secondary"
                  type="button"
                >
                  <ClipboardList className="h-4 w-4" />
                  Add cleaning task
                </Button>
                <Button
                  className={btnSecondaryLight}
                  onClick={() => document.getElementById("brain-dump")?.scrollIntoView()}
                  variant="secondary"
                  type="button"
                >
                  <Brain className="h-4 w-4" />
                  Capture list
                </Button>
                <Button
                  className={btnSecondaryLight}
                  onClick={() => document.getElementById("task-table")?.scrollIntoView()}
                  variant="secondary"
                  type="button"
                >
                  <Table2 className="h-4 w-4" />
                  Table view
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(240px,420px)_auto]">
                <label className="space-y-1.5">
                  <span className={SM_LABEL}>Quick capture</span>
                  <Input
                    className={SM_INPUT}
                    placeholder="Type a task and press Enter"
                    value={brainDumpText}
                    onChange={(event) => setBrainDumpText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addBrainDumpItem();
                      }
                    }}
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    className={cn("w-full", btnSecondaryLight)}
                    disabled={!brainDumpText.trim()}
                    onClick={addBrainDumpItem}
                    variant="secondary"
                  >
                    <ListChecks className="h-4 w-4" />
                    Add to capture list
                  </Button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </ModuleActionBar>

      <KitchenChecklistCleaningSection
        data={data}
        setData={setData}
        today={today}
        navigateWithinApp={navigateWithinApp}
        restrictChildNavigation={restrictChildNavigation}
      />

      <WorkspaceRoutedSection
        flush
        subtitle="Filter the task database, then pick a layout."
        title="Filters & layout"
      >
        <WorkspaceFilterBar className={FILTER_SHELL} tone="light">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_180px_180px_180px_160px]">
            <label className="space-y-1.5">
              <span className={SM_LABEL}>Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#637381]" />
                <Input
                  className={cn(SM_INPUT, "pl-9")}
                  placeholder="Search tasks, zones, categories"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
            </label>
            <TaskField label="Filter by person">
              <Select
                className={SM_INPUT}
                value={personFilter}
                onChange={(event) => setPersonFilter(event.target.value)}
              >
                <option value="all">All people</option>
                <option value="unassigned">Unassigned</option>
                {taskPersonRoster.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </TaskField>
            <TaskField label="Filter by room/zone">
              <Select
                className={SM_INPUT}
                value={zoneFilter}
                onChange={(event) => setZoneFilter(event.target.value)}
              >
                <option value="all">All zones</option>
                {zoneOptions.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            </TaskField>
            <TaskField label="Filter by status">
              <Select
                className={SM_INPUT}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {taskStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </TaskField>
            <TaskField label="Filter by recurring">
              <Select
                className={SM_INPUT}
                value={recurringFilter}
                onChange={(event) => setRecurringFilter(event.target.value)}
              >
                <option value="all">All</option>
                <option value="recurring">Recurring</option>
                <option value="one-time">One-time</option>
              </Select>
            </TaskField>
          </div>
          <div className="mt-4">
            <nav
              className="flex gap-0.5 overflow-x-auto rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-1 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]"
              aria-label="Cleaning workspace layouts"
            >
              {cleaningWorkspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "motion-tab min-h-10 whitespace-nowrap rounded-[6px] border border-transparent px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
                    activeView === tab.id ? segmentActiveLight : segmentInactiveLight,
                  )}
                  onClick={() => setActiveView(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </WorkspaceFilterBar>
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="Workspace view">
        {activeView === "kitchen" ? (
          <KitchenHubSection data={data} setData={setData} today={today} />
        ) : null}
        {activeView === "rooms" ? (
          <CleaningHubTiles
            chores={chores}
            completionRecords={data.cleaningCompletionRecords ?? []}
            rooms={data.cleaningRooms ?? []}
            today={today}
            onOpenRoom={(id) => setSelectedRoomId(id)}
          />
        ) : null}
        {activeView === "list" ? (
          <MainListView
            members={data.familyMembers}
            onComplete={completeTask}
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
            onQuickUpdate={updateTask}
            tasks={filteredTasks}
          />
        ) : null}
        {activeView === "tracker" ? (
          <SimpleChoreTracker
            data={data}
            setData={setData}
            todayIso={today}
            dashboardViewMemberId={dashboardViewMemberId}
            onAddChore={(opts) => addTask({ type: "chore", title: opts?.title, frequency: opts?.frequency ?? "weekly" })}
          />
        ) : null}
        {activeView === "board" ? (
          <BoardView
            adminSettings={data.adminSettings}
            members={data.familyMembers}
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
            onStatusChange={(task, status) =>
              updateTaskWithActivity(task, { status }, `Updated task status: ${task.title}.`)
            }
            tasks={filteredTasks}
            today={today}
          />
        ) : null}
        {activeView === "person" ? (
          <ByPersonView
            members={data.familyMembers}
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
            tasks={filteredTasks}
          />
        ) : null}
        {activeView === "day" ? (
          <ByDayView
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
            tasks={filteredTasks}
            today={today}
          />
        ) : null}
        {activeView === "table" ? (
          <TaskPowerTable
            adminSettings={data.adminSettings}
            members={data.familyMembers}
            onComplete={completeTask}
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
            tasks={filteredTasks}
            updateTask={updateTask}
          />
        ) : null}
      </WorkspaceRoutedSection>

      {selectedRoomId ? (
        <CleaningPlaybookDrawer
          chores={chores}
          completionRecords={data.cleaningCompletionRecords ?? []}
          familyMembers={data.familyMembers}
          onAppendCleaningCompletion={(record, roomTitle) =>
            setData((current) =>
              createActivity(
                {
                  ...current,
                  cleaningCompletionRecords: [
                    record,
                    ...(current.cleaningCompletionRecords ?? []),
                  ],
                },
                {
                  type: "completed",
                  entityType: "cleaningRoom",
                  entityId: record.roomId,
                  entityTitle: roomTitle,
                  memberId: record.completedByMemberId,
                  message: `Completed cleaning for ${roomTitle}`,
                },
              ),
            )
          }
          onClose={() => setSelectedRoomId(null)}
          onPatchCleaningCompletion={(recordId, patch) =>
            setData((current) => ({
              ...current,
              cleaningCompletionRecords: (current.cleaningCompletionRecords ?? []).map((row) =>
                row.id === recordId ? { ...row, ...patch } : row,
              ),
            }))
          }
          onUpdateRoom={(roomId, updater) =>
            setData((current) => ({
              ...current,
              cleaningRooms: (current.cleaningRooms ?? []).map((room) =>
                room.id === roomId ? updater(room) : room,
              ),
            }))
          }
          preferenceMemberId={data.adminSettings.activePreferencesMemberId}
          room={(data.cleaningRooms ?? []).find((r) => r.id === selectedRoomId) ?? null}
          today={today}
        />
      ) : null}

      <WorkspaceRoutedSection title="Overview">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TaskOverviewTile label="Due Today" tone="today" value={todayItems.length} />
          <TaskOverviewTile label="Overdue" tone="overdue" value={overdueItems.length} />
          <TaskOverviewTile label="This Week" value={thisWeekItems.length} />
          <TaskOverviewTile label="Waiting Review" value={waitingReviewItems.length} />
          <TaskOverviewTile label="Brain Dump" value={brainDumpItems.length} />
          <TaskOverviewTile label="Unassigned" value={unassignedItems.length} />
        </div>
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="Today">
        <TaskDatabase
          adminSettings={data.adminSettings}
          emptyText="No tasks due today."
          members={data.familyMembers}
          onComplete={completeTask}
          tasks={todayItems}
          updateTask={updateTask}
          variant="today"
        />
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="Overdue">
        <TaskDatabase
          adminSettings={data.adminSettings}
          emptyText="No overdue tasks."
          members={data.familyMembers}
          onComplete={completeTask}
          tasks={overdueItems}
          updateTask={updateTask}
          variant="today"
        />
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="Upcoming / This Week">
        <TaskDatabase
          adminSettings={data.adminSettings}
          emptyText="No upcoming chores this week."
          members={data.familyMembers}
          onComplete={completeTask}
          tasks={upcomingItems}
          updateTask={updateTask}
          variant="upcoming"
        />
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="By Zone">
        <div className="space-y-5">
          {zoneOptions.map((zone) => (
            <ZoneGroup
              adminSettings={data.adminSettings}
              key={zone}
              members={data.familyMembers}
              onComplete={completeTask}
              tasks={data.tasks.filter((task) => (task.zone || "Custom Zone") === zone)}
              title={zone}
              updateTask={updateTask}
            />
          ))}
        </div>
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="By Member">
        <div className="space-y-5">
          {taskPersonRoster.map((member) => (
            <ZoneGroup
              adminSettings={data.adminSettings}
              key={member.id}
              members={data.familyMembers}
              onComplete={completeTask}
              tasks={data.tasks.filter((task) => task.assignedMemberId === member.id)}
              title={getMemberFullName(member)}
              updateTask={updateTask}
            />
          ))}
          <ZoneGroup
            adminSettings={data.adminSettings}
            members={data.familyMembers}
            onComplete={completeTask}
            tasks={data.tasks.filter((task) => !task.assignedMemberId)}
            title="Unassigned"
            updateTask={updateTask}
          />
        </div>
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush title="Cleaning Schedule">
        <div className="grid gap-5 xl:grid-cols-2">
          {(["daily", "weekly", "monthly", "quarterly"] as TaskFrequency[]).map(
            (frequency) => (
              <ScheduleView
                adminSettings={data.adminSettings}
                frequency={frequency}
                key={frequency}
                members={data.familyMembers}
                onComplete={completeTask}
                tasks={chores.filter((task) => task.frequency === frequency)}
                updateTask={updateTask}
              />
            ),
          )}
        </div>
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush id="brain-dump" title="Brain Dump">
        <BrainDumpDatabase
          adminSettings={data.adminSettings}
          members={data.familyMembers}
          onOrganize={organizeBrainDumpItem}
          tasks={brainDumpItems}
          updateTask={updateTask}
        />
      </WorkspaceRoutedSection>

      <WorkspaceRoutedSection flush id="task-table" title="Table">
        <TaskPowerTable
          adminSettings={data.adminSettings}
          members={data.familyMembers}
          onComplete={completeTask}
          onOpenDetail={(task) => setSelectedTaskId(task.id)}
          tasks={data.tasks}
          updateTask={updateTask}
        />
      </WorkspaceRoutedSection>
      {selectedTask ? (
        <TaskDetailDrawer
          adminSettings={data.adminSettings}
          members={data.familyMembers}
          onClose={() => setSelectedTaskId("")}
          onComplete={completeTask}
          onUpdate={(updates, message) =>
            updateTaskWithActivity(selectedTask, updates, message)
          }
          task={selectedTask}
        />
      ) : null}
    </WorkspacePageShell>
    </div>
  );
}

function TasksOpeningScreen({
  members,
  onContinueHousehold,
  onSelectMember,
}: {
  members: FamilyMember[];
  onContinueHousehold: () => void;
  onSelectMember: (memberId: string) => void;
}) {
  return (
    <div className="fh-tasks-entry" aria-labelledby="fh-tasks-entry-title">
      <section className="fh-tasks-entry__card">
        <p className="fh-tasks-entry__eyebrow">Family Dashboard</p>
        <h1 id="fh-tasks-entry-title" className="fh-tasks-entry__title">
          Who is working on tasks?
        </h1>
        <p className="fh-tasks-entry__hint">Select your name to see your task workspace.</p>

        <div className="fh-tasks-entry__members" aria-label="Choose family member">
          {members.map((member) => {
            const label = getMemberFullName(member);
            const initial = label.trim().charAt(0).toUpperCase() || "?";
            return (
              <button
                key={member.id}
                type="button"
                className="fh-tasks-entry__member-btn"
                onClick={() => onSelectMember(member.id)}
              >
                <span className="fh-tasks-entry__avatar" aria-hidden>
                  {initial}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="fh-tasks-entry__member-btn fh-tasks-entry__member-btn--household"
            onClick={onContinueHousehold}
          >
            <span className="fh-tasks-entry__avatar" aria-hidden>
              H
            </span>
            <span>Household / all tasks</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function TaskFlowSummary({
  task,
  members,
}: {
  task: Task;
  members: FamilyMember[];
}) {
  const member = members.find((item) => item.id === task.assignedMemberId);
  return (
    <article className="wd-guided-kiosk__summary-card">
      <div>
        <p className="wd-guided-kiosk__eyebrow">Selected task</p>
        <h3>{task.title}</h3>
      </div>
      <dl>
        <div>
          <dt>Zone</dt>
          <dd>{task.zone || "Household"}</dd>
        </div>
        <div>
          <dt>Assigned</dt>
          <dd>{member ? getMemberFullName(member) : "Unassigned"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{task.status}</dd>
        </div>
      </dl>
    </article>
  );
}

function TaskMainListMobileCards({
  tasks,
  members,
  onComplete,
  onOpenDetail,
  onQuickUpdate,
}: {
  tasks: Task[];
  members: FamilyMember[];
  onComplete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onQuickUpdate: (id: string, updates: Partial<Task>) => void;
}) {
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    ...tasks.map((t) => t.assignedMemberId),
  );

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        return (
          <div
            className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4 shadow-sm"
            key={task.id}
          >
            <label className="flex items-start gap-3">
              <input
                checked={isTaskComplete(task)}
                className="mt-1 h-6 w-6 shrink-0 accent-blue-500"
                onChange={() => onComplete(task)}
                type="checkbox"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#37352f]">{task.title}</p>
                <p className="mt-0.5 text-xs text-[#787774]">{getChecklistProgressLabel(task)}</p>
              </div>
            </label>
            <div className="space-y-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                Assign to
              </span>
              <Select
                value={task.assignedMemberId ?? ""}
                onChange={(event) => {
                  const id = event.target.value;
                  onQuickUpdate(task.id, {
                    assignedMemberId: id,
                    owner: ownerLabelForAssignment(
                      membersForAssignmentSelect(members, id),
                      id,
                      "Family",
                    ),
                  });
                }}
              >
                <option value="">Unassigned</option>
                {assignSelectMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#787774]">
              <span>{task.zone || "Custom Zone"}{task.room ? ` / ${task.room}` : ""}</span>
              <span>·</span>
              <span>
                {formatShortDate(getTaskDueDate(task))}
                {task.dueTime ? ` · ${task.dueTime}` : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                  getTaskFrequencyChipClass(task.frequency, task.frequency === "one-time"),
                )}
              >
                {task.frequency === "one-time" ? "One-time" : task.frequency}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold",
                  getTaskStatusChipClass(task.status),
                )}
              >
                {task.status}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-11 w-full sm:w-auto" onClick={() => onOpenDetail(task)} variant="secondary">
                Details
              </Button>
              <Button
                className="min-h-11 w-full sm:w-auto"
                onClick={() =>
                  onQuickUpdate(task.id, {
                    status: "Snoozed",
                    dueDate: addDaysToDate(getTaskDueDate(task), 1),
                    nextDueDate:
                      task.type === "chore"
                        ? addDaysToDate(getTaskDueDate(task), 1)
                        : task.nextDueDate,
                  })
                }
                variant="ghost"
              >
                Snooze 1d
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MainListView({
  tasks,
  members,
  onComplete,
  onOpenDetail,
  onQuickUpdate,
}: {
  tasks: Task[];
  members: FamilyMember[];
  onComplete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onQuickUpdate: (id: string, updates: Partial<Task>) => void;
}) {
  return (
    <>
      <div className="hidden md:block">
        <WorkspaceTableWrap>
          <table className={cn(workspaceTableClassName, "min-w-[980px]")}>
            <thead>
              <tr>
                <th className="px-3 py-3">Task</th>
                <th className="px-3 py-3">Assigned To</th>
                <th className="px-3 py-3">Zone / Room</th>
                <th className="px-3 py-3">Due Date</th>
                <th className="px-3 py-3">Recurring</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Reward / Points</th>
                <th className="px-3 py-3">More Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <MainTaskRow
                  key={task.id}
                  members={members}
                  onComplete={onComplete}
                  onOpenDetail={onOpenDetail}
                  onQuickUpdate={onQuickUpdate}
                  task={task}
                />
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? <EmptyState text="No tasks match these filters." /> : null}
        </WorkspaceTableWrap>
      </div>
      <div className="md:hidden">
        {tasks.length === 0 ? (
          <EmptyState text="No tasks match these filters." />
        ) : (
          <TaskMainListMobileCards
            members={members}
            onComplete={onComplete}
            onOpenDetail={onOpenDetail}
            onQuickUpdate={onQuickUpdate}
            tasks={tasks}
          />
        )}
      </div>
    </>
  );
}

function MainTaskRow({
  task,
  members,
  onComplete,
  onOpenDetail,
  onQuickUpdate,
}: {
  task: Task;
  members: FamilyMember[];
  onComplete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onQuickUpdate: (id: string, updates: Partial<Task>) => void;
}) {
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    task.assignedMemberId,
  );

  return (
    <tr className="motion-row border-t border-[#ededed]">
      <td className="px-3 py-3">
        <label className="flex items-center gap-3">
          <input
            checked={isTaskComplete(task)}
            className="h-5 w-5 accent-blue-500"
            onChange={() => onComplete(task)}
            type="checkbox"
          />
          <span>
            <span className="block font-medium text-[#37352f]">{task.title}</span>
            <span className="text-xs text-[#787774]">
              {getChecklistProgressLabel(task)}
            </span>
          </span>
        </label>
      </td>
      <td className="px-3 py-3">
        <Select
          value={task.assignedMemberId ?? ""}
          onChange={(event) => {
            const id = event.target.value;
            onQuickUpdate(task.id, {
              assignedMemberId: id,
              owner: ownerLabelForAssignment(
                membersForAssignmentSelect(members, id),
                id,
                "Family",
              ),
            });
          }}
        >
          <option value="">Unassigned</option>
          {assignSelectMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {getMemberFullName(member)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3 text-[#787774]">
        {task.zone || "Custom Zone"}
        {task.room ? ` / ${task.room}` : ""}
      </td>
      <td className="px-3 py-3 text-[#787774]">
        {formatShortDate(getTaskDueDate(task))}
        {task.dueTime ? ` · ${task.dueTime}` : ""}
      </td>
      <td className="px-3 py-3">
        <Badge tone={task.frequency === "one-time" ? "neutral" : "blue"}>
          {task.frequency === "one-time" ? "No" : task.frequency}
        </Badge>
      </td>
      <td className="px-3 py-3">
        <Badge tone={getStatusTone(task.status)}>{task.status}</Badge>
      </td>
      <td className="px-3 py-3 text-[#787774]">{task.rewardPoints ?? 0}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onOpenDetail(task)} variant="secondary">
            Open Detail
          </Button>
          <Button
            onClick={() =>
              onQuickUpdate(task.id, {
                status: "Snoozed",
                dueDate: addDaysToDate(getTaskDueDate(task), 1),
                nextDueDate:
                  task.type === "chore"
                    ? addDaysToDate(getTaskDueDate(task), 1)
                    : task.nextDueDate,
              })
            }
            variant="ghost"
          >
            Snooze
          </Button>
        </div>
      </td>
    </tr>
  );
}

function BoardView({
  adminSettings,
  tasks,
  members,
  onOpenDetail,
  onStatusChange,
  today,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  onOpenDetail: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  today: string;
}) {
  const columns = [
    {
      title: "Today",
      tasks: tasks.filter((task) => getTaskDueDate(task) === today && !isTaskComplete(task)),
    },
    {
      title: "This Week",
      tasks: tasks.filter((task) => isWithinNextDays(getTaskDueDate(task), today, 7)),
    },
    {
      title: "Waiting / Needs Parent Review",
      tasks: tasks.filter((task) => task.status === "Waiting Review"),
    },
    {
      title: "Completed",
      tasks: tasks.filter(isTaskComplete),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => (
        <section
          className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4"
          key={column.title}
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#787774]">
            {column.title} · {column.tasks.length}
          </h3>
          {column.tasks.map((task) => (
            <BoardCard
              adminSettings={adminSettings}
              key={task.id}
              members={members}
              onOpenDetail={onOpenDetail}
              onStatusChange={onStatusChange}
              task={task}
            />
          ))}
          {column.tasks.length === 0 ? <EmptyState text="No items." /> : null}
        </section>
      ))}
    </div>
  );
}

function BoardCard({
  adminSettings,
  task,
  members,
  onOpenDetail,
  onStatusChange,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  onOpenDetail: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const assignRoster = membersForAssignmentSelect(members, task.assignedMemberId);
  const member = assignRoster.find((item) => item.id === task.assignedMemberId);
  const statusOptions = getTaskStatuses(adminSettings);

  return (
    <div className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-3">
      <button
        className="block w-full text-left font-medium text-[#37352f]"
        onClick={() => onOpenDetail(task)}
        type="button"
      >
        {task.title}
      </button>
      <div className="flex flex-wrap gap-2">
        <Badge tone={getDueTone(task)}>{formatShortDate(getTaskDueDate(task))}</Badge>
        <Badge tone="neutral">{member ? getMemberFullName(member) : "Unassigned"}</Badge>
        <Badge tone={task.frequency === "one-time" ? "neutral" : "blue"}>
          {task.frequency}
        </Badge>
      </div>
      <p className="text-xs text-[#787774]">
        {task.zone || "Custom Zone"} · {getChecklistProgressLabel(task)}
        {task.rewardPoints ? ` · ${task.rewardPoints} pts` : ""}
      </p>
      <Select
        value={task.status}
        onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
      >
        {selectOptionsWithCurrent(statusOptions, task.status).map((status) => (
          <option key={status}>{status}</option>
        ))}
      </Select>
    </div>
  );
}

function ByPersonView({
  tasks,
  members,
  onOpenDetail,
}: {
  tasks: Task[];
  members: FamilyMember[];
  onOpenDetail: (task: Task) => void;
}) {
  const columns = [
    ...membersForAssignmentSelect(
      members,
      ...tasks.map((t) => t.assignedMemberId),
    ),
    undefined,
  ];

  return (
    <div className="space-y-4">
      {columns.map((member) => {
        const groupTasks = tasks.filter((task) =>
          member ? task.assignedMemberId === member.id : !task.assignedMemberId,
        );

        return (
          <SimpleTaskGroup
            key={member?.id ?? "unassigned"}
            onOpenDetail={onOpenDetail}
            tasks={groupTasks}
            title={member ? getMemberFullName(member) : "Unassigned"}
          />
        );
      })}
    </div>
  );
}

function ByDayView({
  tasks,
  today,
  onOpenDetail,
}: {
  tasks: Task[];
  today: string;
  onOpenDetail: (task: Task) => void;
}) {
  const groups = [
    { title: "Overdue", tasks: tasks.filter((task) => getTaskDueDate(task) < today) },
    { title: "Today", tasks: tasks.filter((task) => getTaskDueDate(task) === today) },
    {
      title: "This Week",
      tasks: tasks.filter(
        (task) =>
          getTaskDueDate(task) > today &&
          isWithinNextDays(getTaskDueDate(task), today, 7),
      ),
    },
    { title: "Later", tasks: tasks.filter((task) => getTaskDueDate(task) > today) },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SimpleTaskGroup
          key={group.title}
          onOpenDetail={onOpenDetail}
          tasks={group.tasks}
          title={group.title}
        />
      ))}
    </div>
  );
}

function SimpleTaskGroup({
  title,
  tasks,
  onOpenDetail,
}: {
  title: string;
  tasks: Task[];
  onOpenDetail: (task: Task) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="border-b border-[#ededed] pb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#787774]">
        {title} · {tasks.length}
      </h3>
      {tasks.map((task) => (
        <button
          className="motion-row flex w-full items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-3 text-left"
          key={task.id}
          onClick={() => onOpenDetail(task)}
          type="button"
        >
          <span className="font-medium text-[#37352f]">{task.title}</span>
          <span className="text-sm text-[#787774]">{formatShortDate(getTaskDueDate(task))}</span>
        </button>
      ))}
      {tasks.length === 0 ? <EmptyState text="No items." /> : null}
    </section>
  );
}

function TaskDatabaseMobile({
  adminSettings,
  tasks,
  members,
  updateTask,
  onComplete,
  variant,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
  variant: "today" | "upcoming";
}) {
  const zoneOptions = getTaskZones(adminSettings);
  const frequencyOptions = getTaskFrequencies(adminSettings);
  const taskStatusOptions = getTaskStatuses(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    ...tasks.map((t) => t.assignedMemberId),
  );

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const dueDate = getTaskDueDate(task);
        return (
          <div
            className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4 shadow-sm"
            key={task.id}
          >
            <Input
              value={task.title}
              onChange={(event) => updateTask(task.id, { title: event.target.value })}
            />
            <div className="space-y-1.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                Zone
              </span>
              <Select
                value={task.zone || "Custom Zone"}
                onChange={(event) => updateTask(task.id, { zone: event.target.value })}
              >
                {zoneOptions.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                Assigned to
              </span>
              <Select
                value={task.assignedMemberId ?? ""}
                onChange={(event) => {
                  const id = event.target.value;
                  updateTask(task.id, {
                    assignedMemberId: id,
                    owner: ownerLabelForAssignment(
                      membersForAssignmentSelect(members, id),
                      id,
                      "Family",
                    ),
                  });
                }}
              >
                <option value="">Unassigned</option>
                {assignSelectMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                Frequency
              </span>
              <Select
                disabled={task.type !== "chore"}
                value={task.frequency}
                onChange={(event) =>
                  updateTask(task.id, {
                    frequency: event.target.value as TaskFrequency,
                  })
                }
              >
                {selectOptionsWithCurrent(frequencyOptions, task.frequency).map((frequency) => (
                  <option key={frequency}>{frequency}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                {variant === "today" ? "Due date" : "Next due"}
              </span>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) =>
                  updateTask(task.id, {
                    dueDate: event.target.value,
                    nextDueDate: task.type === "chore" ? event.target.value : task.nextDueDate,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
                Status
              </span>
              <Select
                value={task.status}
                onChange={(event) =>
                  updateTask(task.id, {
                    status: event.target.value as TaskStatus,
                  })
                }
              >
                {taskStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
            <Button className="min-h-11 w-full" onClick={() => onComplete(task)} variant="secondary">
              Mark complete
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function TaskDatabase({
  adminSettings,
  tasks,
  members,
  updateTask,
  onComplete,
  emptyText,
  variant,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
  emptyText: string;
  variant: "today" | "upcoming";
}) {
  return (
    <>
      <div className="hidden md:block">
        <WorkspaceTableWrap>
          <table className={cn(workspaceTableClassName, "min-w-[920px]")}>
            <thead>
              <tr>
                <th className="px-3 py-3">Task</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-3 py-3">Assigned To</th>
                <th className="px-3 py-3">Frequency</th>
                <th className="px-3 py-3">{variant === "today" ? "Due Date" : "Next Due"}</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Done</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskTableRow
                  adminSettings={adminSettings}
                  key={task.id}
                  members={members}
                  onComplete={onComplete}
                  task={task}
                  updateTask={updateTask}
                />
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? <EmptyState text={emptyText} /> : null}
        </WorkspaceTableWrap>
      </div>
      <div className="md:hidden">
        {tasks.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
          <TaskDatabaseMobile
            adminSettings={adminSettings}
            members={members}
            onComplete={onComplete}
            tasks={tasks}
            updateTask={updateTask}
            variant={variant}
          />
        )}
      </div>
    </>
  );
}

function ZoneGroup({
  adminSettings,
  title,
  tasks,
  members,
  updateTask,
  onComplete,
}: {
  adminSettings: AdminSettings;
  title: string;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#ededed] pb-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#787774]">
          {title}
        </h3>
        <Badge tone="neutral">{tasks.length}</Badge>
      </div>
      <CompactTaskList
        adminSettings={adminSettings}
        emptyText="No tasks in this zone."
        members={members}
        onComplete={onComplete}
        tasks={tasks}
        updateTask={updateTask}
      />
    </section>
  );
}

function ScheduleView({
  adminSettings,
  frequency,
  tasks,
  members,
  updateTask,
  onComplete,
}: {
  adminSettings: AdminSettings;
  frequency: TaskFrequency;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
}) {
  return (
    <section className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4">
      <div className="flex items-center justify-between border-b border-[#ededed] pb-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#787774]">
          {formatFrequency(frequency)}
        </h3>
        <Badge tone="blue">{tasks.length}</Badge>
      </div>
      <CompactTaskList
        adminSettings={adminSettings}
        emptyText={`No ${frequency} chores.`}
        members={members}
        onComplete={onComplete}
        tasks={tasks}
        updateTask={updateTask}
      />
    </section>
  );
}

function CompactTaskList({
  adminSettings,
  tasks,
  members,
  updateTask,
  onComplete,
  emptyText,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
  emptyText: string;
}) {
  return tasks.length > 0 ? (
    <div className="space-y-2">
      {tasks.map((task) => (
        <CompactTaskRow
          adminSettings={adminSettings}
          key={task.id}
          members={members}
          onComplete={onComplete}
          task={task}
          updateTask={updateTask}
        />
      ))}
    </div>
  ) : (
    <EmptyState text={emptyText} />
  );
}

function CompactTaskRow({
  adminSettings,
  task,
  members,
  updateTask,
  onComplete,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
}) {
  const zoneOptions = getTaskZones(adminSettings);
  const frequencyOptions = getTaskFrequencies(adminSettings);
  const taskStatusOptions = getTaskStatuses(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    task.assignedMemberId,
  );
  const dueDate = getTaskDueDate(task);

  return (
    <div className="motion-row rounded-lg border border-[#ededed] bg-[#fafafa] p-3">
      <div className="grid gap-3 xl:grid-cols-[1.4fr_130px_140px_150px_130px_auto]">
        <TaskField label="Task">
          <Input
            value={task.title}
            onChange={(event) =>
              updateTask(task.id, { title: event.target.value })
            }
          />
        </TaskField>
        <TaskField label="Zone">
          <Select
            value={task.zone || "Custom Zone"}
            onChange={(event) => updateTask(task.id, { zone: event.target.value })}
          >
            {selectOptionsWithCurrent(zoneOptions, task.zone || "Custom Zone").map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </Select>
        </TaskField>
        <TaskField label="Assigned To">
          <Select
            value={task.assignedMemberId ?? ""}
            onChange={(event) => {
              const id = event.target.value;
              updateTask(task.id, {
                assignedMemberId: id,
                owner: ownerLabelForAssignment(
                  membersForAssignmentSelect(members, id),
                  id,
                  "Family",
                ),
              });
            }}
          >
            <option value="">Unassigned</option>
            {assignSelectMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {getMemberFullName(member)}
              </option>
            ))}
          </Select>
        </TaskField>
        <TaskField label="Frequency">
          <Select
            disabled={task.type !== "chore"}
            value={task.frequency}
            onChange={(event) =>
              updateTask(task.id, {
                frequency: event.target.value as TaskFrequency,
              })
            }
          >
            {selectOptionsWithCurrent(frequencyOptions, task.frequency).map((frequency) => (
              <option key={frequency}>{frequency}</option>
            ))}
          </Select>
        </TaskField>
        <TaskField label={task.type === "chore" ? "Next Due" : "Due Date"}>
          <Input
            type="date"
            value={dueDate}
            onChange={(event) =>
              updateTask(task.id, {
                dueDate: event.target.value,
                nextDueDate:
                  task.type === "chore" ? event.target.value : task.nextDueDate,
              })
            }
          />
        </TaskField>
        <TaskField label="Status">
          <Select
            value={task.status}
            onChange={(event) =>
              updateTask(task.id, {
                status: event.target.value as TaskStatus,
              })
            }
          >
            {selectOptionsWithCurrent(taskStatusOptions, task.status).map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </TaskField>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => onComplete(task)} variant="secondary">
            Complete
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={getDueTone(task)}>{formatShortDate(dueDate)}</Badge>
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            getTaskPriorityChipClass(task.priority),
          )}
        >
          {task.priority}
        </span>
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
            task.type === "chore"
              ? getTaskFrequencyChipClass(task.frequency, task.frequency === "one-time")
              : "border border-slate-200 bg-slate-50 text-slate-800",
          )}
        >
          {task.type}
        </span>
      </div>
    </div>
  );
}

function TaskTableRow({
  adminSettings,
  task,
  members,
  updateTask,
  onComplete,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
}) {
  return (
    <tr className="motion-row border-t border-[#ededed]">
      <EditableTaskCells
        adminSettings={adminSettings}
        members={members}
        onComplete={onComplete}
        task={task}
        updateTask={updateTask}
      />
    </tr>
  );
}

function BrainDumpMobileCards({
  adminSettings,
  tasks,
  members,
  updateTask,
  onOrganize,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onOrganize: (task: Task) => void;
}) {
  const zoneOptions = getTaskZones(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    ...tasks.map((t) => t.assignedMemberId),
  );

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4 shadow-sm"
          key={task.id}
        >
          <Input
            value={task.title}
            onChange={(event) => updateTask(task.id, { title: event.target.value })}
          />
          <Input
            placeholder="Notes"
            value={task.notes ?? ""}
            onChange={(event) => updateTask(task.id, { notes: event.target.value })}
          />
          <div className="space-y-1.5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
              Assigned to
            </span>
            <Select
              value={task.assignedMemberId ?? ""}
              onChange={(event) => {
                const id = event.target.value;
                updateTask(task.id, {
                  assignedMemberId: id,
                  owner: ownerLabelForAssignment(
                    membersForAssignmentSelect(members, id),
                    id,
                    "Family",
                  ),
                });
              }}
            >
              <option value="">Unassigned</option>
              {assignSelectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {getMemberFullName(member)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#787774]">
              Zone
            </span>
            <Select
              value={task.zone || "Custom Zone"}
              onChange={(event) => updateTask(task.id, { zone: event.target.value })}
            >
              {selectOptionsWithCurrent(zoneOptions, task.zone || "Custom Zone").map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-[#787774]">Created {formatShortDate(task.createdAt)}</p>
          <Button className="min-h-11 w-full" onClick={() => onOrganize(task)} variant="secondary">
            Organize
          </Button>
        </div>
      ))}
    </div>
  );
}

function BrainDumpDatabase({
  adminSettings,
  tasks,
  members,
  updateTask,
  onOrganize,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onOrganize: (task: Task) => void;
}) {
  return (
    <>
      <div className="hidden md:block">
        <WorkspaceTableWrap>
          <table className={cn(workspaceTableClassName, "min-w-[900px]")}>
            <thead>
              <tr>
                <th className="px-3 py-3">Task</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Assigned To</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Organize Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <BrainDumpRow
                  adminSettings={adminSettings}
                  key={task.id}
                  members={members}
                  onOrganize={onOrganize}
                  task={task}
                  updateTask={updateTask}
                />
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? <EmptyState text="Nothing captured yet." /> : null}
        </WorkspaceTableWrap>
      </div>
      <div className="md:hidden">
        {tasks.length === 0 ? (
          <EmptyState text="Nothing captured yet." />
        ) : (
          <BrainDumpMobileCards
            adminSettings={adminSettings}
            members={members}
            onOrganize={onOrganize}
            tasks={tasks}
            updateTask={updateTask}
          />
        )}
      </div>
    </>
  );
}

function BrainDumpRow({
  adminSettings,
  task,
  members,
  updateTask,
  onOrganize,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onOrganize: (task: Task) => void;
}) {
  const zoneOptions = getTaskZones(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    task.assignedMemberId,
  );

  return (
    <tr className="motion-row border-t border-[#ededed]">
      <td className="px-3 py-3">
        <Input
          value={task.title}
          onChange={(event) => updateTask(task.id, { title: event.target.value })}
        />
      </td>
      <td className="px-3 py-3">
        <Input
          value={task.notes ?? ""}
          onChange={(event) => updateTask(task.id, { notes: event.target.value })}
        />
      </td>
      <td className="px-3 py-3">
        <Select
          value={task.assignedMemberId ?? ""}
          onChange={(event) => {
            const id = event.target.value;
            updateTask(task.id, {
              assignedMemberId: id,
              owner: ownerLabelForAssignment(
                membersForAssignmentSelect(members, id),
                id,
                "Family",
              ),
            });
          }}
        >
          <option value="">Unassigned</option>
          {assignSelectMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {getMemberFullName(member)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3">
        <Select
          value={task.zone || "Custom Zone"}
          onChange={(event) => updateTask(task.id, { zone: event.target.value })}
        >
          {selectOptionsWithCurrent(zoneOptions, task.zone || "Custom Zone").map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3 text-[#787774]">
        {formatShortDate(task.createdAt)}
      </td>
      <td className="px-3 py-3">
        <Button onClick={() => onOrganize(task)} variant="secondary">
          Organize
        </Button>
      </td>
    </tr>
  );
}

function TaskPowerMobileCards({
  tasks,
  members,
  onComplete,
  onOpenDetail,
}: {
  tasks: Task[];
  members: FamilyMember[];
  onComplete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const assignRoster = membersForAssignmentSelect(members, task.assignedMemberId);
        const assignedMember = assignRoster.find(
          (member) => member.id === task.assignedMemberId,
        );
        return (
          <div
            className="motion-card space-y-3 rounded-lg border border-[#ededed] bg-white p-4 shadow-sm"
            key={task.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1 font-semibold text-[#37352f]">{task.title}</p>
              <Badge tone={getStatusTone(task.status)}>{task.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{task.type}</Badge>
              <Badge tone={task.frequency === "one-time" ? "neutral" : "blue"}>
                {task.frequency}
              </Badge>
            </div>
            <p className="text-sm text-[#787774]">
              {task.zone || "Zone"} · {assignedMember ? getMemberFullName(assignedMember) : "Unassigned"}
            </p>
            <p className="text-sm text-[#787774]">
              Next due {formatShortDate(getTaskDueDate(task))}
              {task.lastCompletedDate ? ` · Last ${formatShortDate(task.lastCompletedDate)}` : ""}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-11 w-full sm:flex-1" onClick={() => onOpenDetail(task)} variant="secondary">
                Open detail
              </Button>
              <Button className="min-h-11 w-full sm:flex-1" onClick={() => onComplete(task)} variant="ghost">
                Complete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskPowerTable({
  adminSettings,
  tasks,
  members,
  updateTask,
  onComplete,
  onOpenDetail,
}: {
  adminSettings: AdminSettings;
  tasks: Task[];
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}) {
  return (
    <>
      <div className="hidden md:block">
        <WorkspaceTableWrap>
          <table className={cn(workspaceTableClassName, "min-w-[1120px]")}>
            <thead>
              <tr>
                <th className="px-3 py-3">Task</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-3 py-3">Assigned To</th>
                <th className="px-3 py-3">Frequency</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Next Due</th>
                <th className="px-3 py-3">Last Completed</th>
                <th className="px-3 py-3">Done</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr className="motion-row border-t border-[#ededed]" key={task.id}>
                  <EditableTaskCells
                    adminSettings={adminSettings}
                    includeLastCompleted
                    includeType
                    members={members}
                    onComplete={onComplete}
                    onOpenDetail={onOpenDetail}
                    task={task}
                    updateTask={updateTask}
                  />
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? <EmptyState text="No tasks." /> : null}
        </WorkspaceTableWrap>
      </div>
      <div className="md:hidden">
        {tasks.length === 0 ? (
          <EmptyState text="No tasks." />
        ) : (
          <TaskPowerMobileCards
            members={members}
            onComplete={onComplete}
            onOpenDetail={onOpenDetail}
            tasks={tasks}
          />
        )}
      </div>
    </>
  );
}

function EditableTaskCells({
  adminSettings,
  task,
  members,
  updateTask,
  onComplete,
  onOpenDetail,
  includeType = false,
  includeLastCompleted = false,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  onComplete: (task: Task) => void;
  onOpenDetail?: (task: Task) => void;
  includeType?: boolean;
  includeLastCompleted?: boolean;
}) {
  const zoneOptions = getTaskZones(adminSettings);
  const frequencyOptions = getTaskFrequencies(adminSettings);
  const taskStatusOptions = getTaskStatuses(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    task.assignedMemberId,
  );
  const dueDate = getTaskDueDate(task);

  return (
    <>
      <td className="px-3 py-3">
        <Input
          value={task.title}
          onChange={(event) => updateTask(task.id, { title: event.target.value })}
        />
      </td>
      {includeType ? (
        <td className="px-3 py-3">
          <Select
            value={task.type}
            onChange={(event) => {
              const type = event.target.value as TaskType;
              updateTask(task.id, {
                type,
                isBrainDump: false,
                frequency: type === "chore" ? task.frequency : "one-time",
              });
            }}
          >
            {taskTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
        </td>
      ) : null}
      <td className="px-3 py-3">
        <Select
          value={task.zone || "Custom Zone"}
          onChange={(event) => updateTask(task.id, { zone: event.target.value })}
        >
          {zoneOptions.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3">
        <Select
          value={task.assignedMemberId ?? ""}
          onChange={(event) => {
            const id = event.target.value;
            updateTask(task.id, {
              assignedMemberId: id,
              owner: ownerLabelForAssignment(
                membersForAssignmentSelect(members, id),
                id,
                "Family",
              ),
            });
          }}
        >
          <option value="">Unassigned</option>
          {assignSelectMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {getMemberFullName(member)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3">
        <Select
          disabled={task.type !== "chore"}
          value={task.frequency}
          onChange={(event) =>
            updateTask(task.id, {
              frequency: event.target.value as TaskFrequency,
            })
          }
        >
          {selectOptionsWithCurrent(frequencyOptions, task.frequency).map((frequency) => (
            <option key={frequency}>{frequency}</option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3">
        <Select
          value={task.status}
          onChange={(event) =>
            updateTask(task.id, {
              status: event.target.value as TaskStatus,
            })
          }
        >
          {taskStatusOptions.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-3">
        <Input
          type="date"
          value={dueDate}
          onChange={(event) =>
            updateTask(task.id, {
              dueDate: event.target.value,
              nextDueDate: task.type === "chore" ? event.target.value : task.nextDueDate,
            })
          }
        />
      </td>
      {includeLastCompleted ? (
        <td className="px-3 py-3 text-[#787774]">
          {formatShortDate(task.lastCompletedDate)}
        </td>
      ) : null}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onComplete(task)} variant="secondary">
            Complete
          </Button>
          {onOpenDetail ? (
            <Button onClick={() => onOpenDetail(task)} variant="ghost">
              Detail
            </Button>
          ) : null}
        </div>
      </td>
    </>
  );
}

function TaskDetailDrawer({
  adminSettings,
  task,
  members,
  onClose,
  onComplete,
  onUpdate,
}: {
  adminSettings: AdminSettings;
  task: Task;
  members: FamilyMember[];
  onClose: () => void;
  onComplete: (task: Task) => void;
  onUpdate: (updates: Partial<Task>, message?: string) => void;
}) {
  useDrawerEscape(true, onClose);
  const taskDrawerTitleId = useId();
  const zoneOptions = getTaskZones(adminSettings);
  const frequencyOptions = getTaskFrequencies(adminSettings);
  const priorityOptions = getTaskPriorities(adminSettings);
  const categoryOptions = getTaskCategories(adminSettings);
  const assignSelectMembers = membersForAssignmentSelect(
    members,
    task.assignedMemberId,
  );
  const assigneeBadgeMember = assignSelectMembers.find(
    (m) => m.id === task.assignedMemberId,
  );

  function addChecklistItem() {
    const checklist = task.checklist ?? [];
    onUpdate(
      {
        checklist: [
          ...checklist,
          {
            id: crypto.randomUUID(),
            text: "New checklist item",
            completed: false,
          },
        ],
      },
      `Updated task checklist: ${task.title}.`,
    );
  }

  function updateChecklistItem(id: string, text: string) {
    onUpdate({
      checklist: (task.checklist ?? []).map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    });
  }

  function toggleChecklistItem(id: string) {
    onUpdate({
      checklist: (task.checklist ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : undefined,
            }
          : item,
      ),
    });
  }

  function addReferenceMedia() {
    const nextMedia: TaskReferenceMedia = {
      id: crypto.randomUUID(),
      type: "image",
      url: "",
      caption: "Bathroom counter should be clear and wiped down.",
      displayOrder: task.referenceMedia?.length ?? 0,
      createdAt: new Date().toISOString(),
    };

    onUpdate(
      { referenceMedia: [...(task.referenceMedia ?? []), nextMedia] },
      `Added reference media for ${task.title}.`,
    );
  }

  function removeReferenceMedia(id: string) {
    onUpdate(
      { referenceMedia: (task.referenceMedia ?? []).filter((item) => item.id !== id) },
      `Removed reference media for ${task.title}.`,
    );
  }

  function updateReferenceMedia(id: string, updates: Partial<TaskReferenceMedia>) {
    onUpdate({
      referenceMedia: (task.referenceMedia ?? []).map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    });
  }

  function addCompletionProof() {
    const proof: TaskCompletionProof = {
      id: crypto.randomUUID(),
      type: "image",
      url: "",
      note: "",
      uploadedBy: task.assignedMemberId,
      uploadedAt: new Date().toISOString(),
    };

    onUpdate({ completionProof: [...(task.completionProof ?? []), proof] });
  }

  function updateCompletionProof(id: string, updates: Partial<TaskCompletionProof>) {
    onUpdate({
      completionProof: (task.completionProof ?? []).map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    });
  }

  function removeCompletionProof(id: string) {
    onUpdate({
      completionProof: (task.completionProof ?? []).filter((item) => item.id !== id),
    });
  }

  return (
    <>
      <DrawerBackdrop
        ariaLabel="Close task details"
        onClick={onClose}
      />
      <DrawerPanel role="dialog" aria-modal="true" aria-labelledby={taskDrawerTitleId}>
        <DrawerHeader
          title={
            <>
              <h2
                id={taskDrawerTitleId}
                className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.65rem]"
              >
                {task.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="neutral">
                  {assigneeBadgeMember ? getMemberFullName(assigneeBadgeMember) : "Unassigned"}
                </Badge>
                <Badge tone={getDueTone(task)}>{formatShortDate(getTaskDueDate(task))}</Badge>
                <Badge tone={getStatusTone(task.status)}>{task.status}</Badge>
              </div>
            </>
          }
          trailing={
            <Button className="min-h-11 gap-2 px-3" onClick={onClose} variant="ghost">
              <X className="h-4 w-4" />
              Close
            </Button>
          }
        />

        <DrawerBody className="grid min-h-0 gap-5 xl:grid-cols-[1fr_260px]">
        <main className="min-w-0 space-y-5">
          <DetailSection title="Description">
            <Textarea
              value={task.description ?? ""}
              onChange={(event) => onUpdate({ description: event.target.value })}
            />
          </DetailSection>

          <DetailSection
            action={
              <Button onClick={addChecklistItem} variant="secondary">
                Add item
              </Button>
            }
            title={`Checklist · ${getChecklistProgressLabel(task)}`}
          >
            <div className="space-y-2">
              {(task.checklist ?? []).map((item) => (
                <label
                  className="motion-row flex items-center gap-3 rounded-lg border border-[#ededed] bg-white p-3"
                  key={item.id}
                >
                  <input
                    checked={item.completed}
                    className="h-5 w-5 accent-blue-500"
                    onChange={() => toggleChecklistItem(item.id)}
                    type="checkbox"
                  />
                  <Input
                    value={item.text}
                    onChange={(event) => updateChecklistItem(item.id, event.target.value)}
                  />
                </label>
              ))}
              {(task.checklist ?? []).length === 0 ? (
                <EmptyState text="No checklist items." />
              ) : null}
            </div>
          </DetailSection>

          <DetailSection
            action={
              <Button onClick={addReferenceMedia} variant="secondary">
                Add media URL
              </Button>
            }
            title="Expected Result / Reference Media"
          >
            <ReferenceMediaList
              media={task.referenceMedia ?? []}
              onRemove={removeReferenceMedia}
              onUpdate={updateReferenceMedia}
            />
          </DetailSection>

          <DetailSection
            action={
              <Button onClick={addCompletionProof} variant="secondary">
                Add proof URL
              </Button>
            }
            title="Completion Proof"
          >
            {task.requiresProof ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Proof will be required before this task can be fully approved once
                uploads are enabled.
              </p>
            ) : null}
            <CompletionProofList
              members={members}
              onRemove={removeCompletionProof}
              onUpdate={updateCompletionProof}
              proof={task.completionProof ?? []}
            />
          </DetailSection>

          <DetailSection title="Rules">
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                checked={Boolean(task.requiresVerification)}
                label="Verification required"
                onChange={(value) => onUpdate({ requiresVerification: value })}
              />
              <ToggleField
                checked={Boolean(task.requiresProof)}
                label="Proof required"
                onChange={(value) => onUpdate({ requiresProof: value })}
              />
            </div>
          </DetailSection>

          <DetailSection title="History">
            <p className="text-sm text-[#787774]">
              Created {formatShortDate(task.createdAt)} · Last completed{" "}
              {formatShortDate(task.lastCompletedDate)} · Updated{" "}
              {formatShortDate(task.updatedAt)}
            </p>
          </DetailSection>
        </main>

        <aside className="space-y-3">
          <DetailSection title="Properties">
            <div className="space-y-3">
              <TaskField label="Assigned to">
                <Select
                  value={task.assignedMemberId ?? ""}
                  onChange={(event) => {
                    const id = event.target.value;
                    onUpdate({
                      assignedMemberId: id,
                      owner: ownerLabelForAssignment(
                        membersForAssignmentSelect(members, id),
                        id,
                        "Family",
                      ),
                    });
                  }}
                >
                  <option value="">Unassigned</option>
                  {assignSelectMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberFullName(member)}
                    </option>
                  ))}
                </Select>
              </TaskField>
              <TaskField label="Priority">
                <Select
                  value={task.priority}
                  onChange={(event) =>
                    onUpdate({ priority: event.target.value as Task["priority"] })
                  }
                >
                  {selectOptionsWithCurrent(priorityOptions, task.priority).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </TaskField>
              <TaskField label="Zone">
                <Select
                  value={task.zone || "Custom Zone"}
                  onChange={(event) => onUpdate({ zone: event.target.value })}
                >
                  {selectOptionsWithCurrent(zoneOptions, task.zone || "Custom Zone").map((zone) => (
                    <option key={zone}>{zone}</option>
                  ))}
                </Select>
              </TaskField>
              <TaskField label="Category">
                <Select
                  value={task.category ?? ""}
                  onChange={(event) => onUpdate({ category: event.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {selectOptionsWithCurrent(categoryOptions, task.category).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </TaskField>
              <TaskField label="Recurrence">
                <Select
                  value={task.frequency}
                  onChange={(event) =>
                    onUpdate({ frequency: event.target.value as TaskFrequency })
                  }
                >
                  {selectOptionsWithCurrent(frequencyOptions, task.frequency).map((frequency) => (
                    <option key={frequency}>{frequency}</option>
                  ))}
                </Select>
              </TaskField>
              <TaskField label="Reward points">
                <Input
                  type="number"
                  value={task.rewardPoints ?? 0}
                  onChange={(event) =>
                    onUpdate({ rewardPoints: Number(event.target.value) || 0 })
                  }
                />
              </TaskField>
              <TaskField label="Notes">
                <Textarea
                  value={task.notes ?? ""}
                  onChange={(event) => onUpdate({ notes: event.target.value })}
                />
              </TaskField>
              <Button className="w-full" onClick={() => onComplete(task)} variant="primary">
                Complete
              </Button>
            </div>
          </DetailSection>
        </aside>
        </DrawerBody>
      </DrawerPanel>
    </>
  );
}

function DetailSection({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className={cn(workspaceFormSectionClassName, "flex flex-col")}>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#ededed] pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#37352f]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ReferenceMediaList({
  media,
  onRemove,
  onUpdate,
}: {
  media: TaskReferenceMedia[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TaskReferenceMedia>) => void;
}) {
  if (media.length === 0) {
    return (
      <EmptyState text="Add a reference photo or video later to show what finished should look like." />
    );
  }

  return (
    <div className="space-y-3">
      {[...media]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => (
          <div
            className="motion-row grid gap-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-3 lg:grid-cols-[140px_120px_1fr_auto]"
            key={item.id}
          >
            <MediaPreview type={item.type} url={item.url} />
            <TaskField label="Media type">
              <Select
                value={item.type}
                onChange={(event) =>
                  onUpdate(item.id, {
                    type: event.target.value as TaskReferenceMedia["type"],
                  })
                }
              >
                <option value="image">image</option>
                <option value="video">video</option>
              </Select>
            </TaskField>
            <div className="grid gap-2">
              <Input
                placeholder="Reference media URL"
                value={item.url}
                onChange={(event) => onUpdate(item.id, { url: event.target.value })}
              />
              <Input
                placeholder="Caption"
                value={item.caption}
                onChange={(event) => onUpdate(item.id, { caption: event.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => onRemove(item.id)} variant="ghost">
                Remove
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}

function CompletionProofList({
  proof,
  members,
  onRemove,
  onUpdate,
}: {
  proof: TaskCompletionProof[];
  members: FamilyMember[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TaskCompletionProof>) => void;
}) {
  if (proof.length === 0) {
    return <EmptyState text="Proof upload storage is not enabled yet." />;
  }

  return (
    <div className="space-y-3">
      {proof.map((item) => (
        <div
          className="motion-row grid gap-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-3 lg:grid-cols-[140px_120px_1fr_auto]"
          key={item.id}
        >
          <MediaPreview type={item.type} url={item.url} />
          <TaskField label="Proof type">
            <Select
              value={item.type}
              onChange={(event) =>
                onUpdate(item.id, {
                  type: event.target.value as TaskCompletionProof["type"],
                })
              }
            >
              <option value="image">image</option>
              <option value="video">video</option>
            </Select>
          </TaskField>
          <div className="grid gap-2">
            <Input
              placeholder="Proof URL"
              value={item.url}
              onChange={(event) => onUpdate(item.id, { url: event.target.value })}
            />
            <Input
              placeholder="Proof note"
              value={item.note}
              onChange={(event) => onUpdate(item.id, { note: event.target.value })}
            />
            <Select
              value={item.uploadedBy}
              onChange={(event) => onUpdate(item.id, { uploadedBy: event.target.value })}
            >
              <option value="">Uploaded by</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {getMemberFullName(member)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => onRemove(item.id)} variant="ghost">
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaPreview({
  type,
  url,
}: {
  type: "image" | "video";
  url: string;
}) {
  if (!url) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[#ededed] bg-[#f7f6f3] text-xs text-[#787774]">
        URL preview
      </div>
    );
  }

  if (type === "video") {
    return (
      <video
        className="h-24 w-full rounded-lg border border-[#ededed] object-cover"
        controls
        src={url}
      />
    );
  }

  return (
    <img
      alt="Task reference"
      className="h-24 w-full rounded-lg border border-[#ededed] object-cover"
      src={url}
    />
  );
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
      {label}
      <input
        checked={checked}
        className="h-5 w-5 accent-blue-500"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}


function TaskOverviewTile({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "today" | "overdue";
  value: number;
}) {
  const toneClass =
    tone === "overdue"
      ? "border-red-400/22"
      : tone === "today"
        ? "border-blue-400/25"
        : "border-slate-200";

  return (
    <div
      className={cn(
        "motion-card rounded-md border bg-white p-3 ring-1 ring-slate-950/[0.04] sm:p-4",
        toneClass,
      )}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-sm leading-6 text-slate-400 sm:text-left">
      {text}
    </div>
  );
}

function TaskField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className={SM_LABEL}>{label}</span>
      {children}
    </label>
  );
}

function getTaskDueDate(task: Task) {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}

function isWithinNextDays(value: string, today: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  const start = new Date(`${today}T00:00:00`);

  if (Number.isNaN(date.getTime()) || Number.isNaN(start.getTime())) {
    return false;
  }

  const difference = date.getTime() - start.getTime();
  return difference >= 0 && difference <= days * 24 * 60 * 60 * 1000;
}

function formatFrequency(frequency: TaskFrequency) {
  if (frequency === "one-time") {
    return "One time";
  }
  if (frequency === "as-needed") {
    return "As needed";
  }
  return `${frequency[0]!.toUpperCase()}${frequency.slice(1)}`;
}

function getDueTone(task: Task): "neutral" | "blue" | "red" {
  const dueDate = getTaskDueDate(task);
  const today = new Date().toISOString().slice(0, 10);

  if (dueDate < today && !isTaskComplete(task)) {
    return "red";
  }

  if (dueDate === today && !isTaskComplete(task)) {
    return "blue";
  }

  return "neutral";
}

function isTaskComplete(task: Task) {
  return task.status === "Done" || task.status === "Completed";
}

function getStatusTone(status: TaskStatus): "neutral" | "blue" | "green" | "amber" | "red" {
  if (status === "Done" || status === "Completed") {
    return "green";
  }

  if (status === "Waiting Review") {
    return "amber";
  }

  if (status === "Skipped" || status === "Snoozed") {
    return "neutral";
  }

  if (status === "In Progress" || status === "Today") {
    return "blue";
  }

  return "neutral";
}

function getChecklistProgressLabel(task: Task) {
  const checklist = task.checklist ?? [];

  if (checklist.length === 0) {
    return "0/0 complete";
  }

  const completed = checklist.filter((item) => item.completed).length;
  return `${completed}/${checklist.length} complete`;
}

function addDaysToDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

