import { Children, useState, type DragEvent, type ReactNode } from "react";
import type { PlannerEvent, Task } from "../../data/familyData";
import { KioskCard, KioskCardGrid } from "../cards/Card";
import "../cards/kiosk.css";
import { formatShortDate } from "../../lib/utils";
import { useMemberTaskSwipe } from "../../hooks/useMemberTaskSwipe";
import { trackDragStart, trackInteraction } from "../../lib/kioskAnalytics";
import { trackMemberTaskComplete } from "../../lib/memberDashboardAnalytics";
import { cn } from "../../lib/utils";

const ANALYTICS_SURFACE = "member:dashboard";

function taskEmoji(task: Task, stateLabel: string): string {
  if (task.type === "chore") {
    if (stateLabel === "overdue") return "⚠️";
    if (stateLabel === "today") return "✨";
    if (stateLabel === "recurring") return "🔁";
    return "🧹";
  }
  return "📋";
}

export function MemberDashboardTaskCard({
  task,
  stateLabel,
  showCompleted = false,
  selected = false,
  onSelect,
  onComplete,
  getTaskDueDate,
  draggable = false,
  onDragStart,
  isDragging = false,
}: {
  task: Task;
  stateLabel: string;
  showCompleted?: boolean;
  selected?: boolean;
  onSelect?: (task: Task) => void;
  onComplete: (task: Task) => void;
  getTaskDueDate: (task: Task) => string;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  isDragging?: boolean;
}) {
  const done =
    showCompleted ||
    task.status === "Done" ||
    task.status === "Completed" ||
    task.status === "Skipped";
  const swipe = useMemberTaskSwipe({
    onComplete: () => {
      if (!done) {
        trackMemberTaskComplete(task.id);
        onComplete(task);
      }
    },
  });

  return (
    <div
      className={cn(
        "wd-member-task-card--swipe",
        selected && "fh-member-task--selected",
      )}
      style={{ transform: `translateX(${swipe.offsetX}px)` }}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      <KioskCard
        category={task.type === "chore" ? "chores" : "member-tasks"}
        tone={
          done
            ? "success"
            : stateLabel === "overdue"
              ? "warning"
              : stateLabel === "today"
                ? "events"
                : undefined
        }
        title={task.title}
        subtitle={
          task.type === "chore"
            ? `${task.frequency} · Next: ${formatShortDate(getTaskDueDate(task))}`
            : `Due: ${formatShortDate(getTaskDueDate(task))}`
        }
        meta={
          task.notes
            ? task.notes.slice(0, 80)
            : `Swipe right to complete · Tap to select`
        }
        emoji={taskEmoji(task, stateLabel)}
        checked={done}
        onCheckedChange={
          !done
            ? (checked) => {
                if (checked) {
                  trackMemberTaskComplete(task.id);
                  onComplete(task);
                }
              }
            : undefined
        }
        checkboxLabel={`Complete ${task.title}`}
        badges={[
          <span key="s" className="fh-kiosk-card__badge">
            {stateLabel}
          </span>,
          <span key="st" className="fh-kiosk-card__badge">
            {task.status}
          </span>,
        ]}
        expandable={Boolean(task.description || task.notes)}
        expandContent={<p>{task.description || task.notes || "No extra details."}</p>}
        draggable={draggable}
        isDragging={isDragging}
        onDragStart={onDragStart}
        analyticsSurface={ANALYTICS_SURFACE}
        onClick={() => onSelect?.(task)}
        actions={
          !done
            ? [
                {
                  id: "complete",
                  label: "Complete",
                  variant: "primary",
                  onClick: () => {
                    trackMemberTaskComplete(task.id);
                    onComplete(task);
                  },
                },
              ]
            : undefined
        }
        actionsReveal="always"
      />
    </div>
  );
}

/** @deprecated Use MemberDashboardTaskCard */
export const MemberTaskCard = MemberDashboardTaskCard;

function BoardSection({
  emoji,
  title,
  count,
  emptyText,
  children,
}: {
  emoji: string;
  title: string;
  count: number;
  emptyText: string;
  children: ReactNode;
}) {
  const hasContent = Children.count(children) > 0;

  return (
    <section>
      <h2 className="fh-member-board__section-title">
        <span className="fh-member-board__section-emoji" aria-hidden>
          {emoji}
        </span>
        {title}
        <span className="fh-member-board__section-count">{count}</span>
      </h2>
      {hasContent ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <p className="fh-member-board__empty">{emptyText}</p>
      )}
    </section>
  );
}

function PlannerCard({ event }: { event: PlannerEvent }) {
  return (
    <KioskCard
      category="events"
      title={event.title}
      subtitle={`${event.time || "Any time"} · calendar`}
      emoji="📅"
      badge={<span className="fh-kiosk-card__badge">{event.category}</span>}
      analyticsSurface={ANALYTICS_SURFACE}
    />
  );
}

export function MemberWeeklyTaskGrid({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCompleteTask,
  getTaskDueDate,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  getTaskDueDate: (task: Task) => string;
}) {
  const [order, setOrder] = useState(() => tasks.map((t) => t.id));
  const [dragId, setDragId] = useState<string | null>(null);

  const ordered = order.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as Task[];
  const missing = tasks.filter((t) => !order.includes(t.id));

  return (
    <KioskCardGrid columns={2} aria-label="Weekly chores">
      {[...ordered, ...missing].map((task) => (
        <li
          key={task.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const sourceId = e.dataTransfer.getData("text/plain");
            if (!sourceId || sourceId === task.id) {
              return;
            }
            const ids = [...order, ...missing.map((t) => t.id)].filter(
              (id, i, arr) => arr.indexOf(id) === i,
            );
            const from = ids.indexOf(sourceId);
            const to = ids.indexOf(task.id);
            if (from >= 0 && to >= 0) {
              const next = [...ids];
              next.splice(from, 1);
              next.splice(to, 0, sourceId);
              setOrder(next);
              trackInteraction(ANALYTICS_SURFACE, "task_reorder", { from, to });
            }
            setDragId(null);
          }}
        >
          <MemberDashboardTaskCard
            task={task}
            stateLabel="weekly"
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
            draggable
            isDragging={dragId === task.id}
            onDragStart={(e) => {
              setDragId(task.id);
              e.dataTransfer.setData("text/plain", task.id);
              trackDragStart(ANALYTICS_SURFACE, task.id);
            }}
          />
        </li>
      ))}
    </KioskCardGrid>
  );
}

export type MemberTaskBoardProps = {
  memberDisplayName: string;
  itemsDueToday: Task[];
  overdueItems: Task[];
  upcomingItems: Task[];
  recurringChores: Task[];
  recentlyCompletedItems: Task[];
  todayPlannerItems: PlannerEvent[];
  weeklyTasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  getTaskDueDate: (task: Task) => string;
};

export function MemberTaskBoard({
  memberDisplayName,
  itemsDueToday,
  overdueItems,
  upcomingItems,
  recurringChores,
  recentlyCompletedItems,
  todayPlannerItems,
  weeklyTasks,
  selectedTaskId,
  onSelectTask,
  onCompleteTask,
  getTaskDueDate,
}: MemberTaskBoardProps) {
  return (
    <div className="fh-member-board">
      <BoardSection
        emoji="☀️"
        title="Today"
        count={itemsDueToday.length + todayPlannerItems.length}
        emptyText={`${memberDisplayName} has nothing due today.`}
      >
        {itemsDueToday.map((task) => (
          <MemberDashboardTaskCard
            key={task.id}
            task={task}
            stateLabel="today"
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
          />
        ))}
        {todayPlannerItems.map((event) => (
          <PlannerCard key={event.id} event={event} />
        ))}
      </BoardSection>

      <BoardSection
        emoji="⚠️"
        title="Overdue"
        count={overdueItems.length}
        emptyText="Nothing overdue — nice work!"
      >
        {overdueItems.map((task) => (
          <MemberDashboardTaskCard
            key={task.id}
            task={task}
            stateLabel="overdue"
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
          />
        ))}
      </BoardSection>

      <BoardSection
        emoji="🗓️"
        title="Upcoming"
        count={upcomingItems.length}
        emptyText="No upcoming tasks on the horizon."
      >
        {upcomingItems.map((task) => (
          <MemberDashboardTaskCard
            key={task.id}
            task={task}
            stateLabel="upcoming"
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
          />
        ))}
      </BoardSection>

      <BoardSection
        emoji="🔁"
        title="Recurring chores"
        count={recurringChores.length}
        emptyText="No recurring chores assigned."
      >
        {recurringChores.map((task) => (
          <MemberDashboardTaskCard
            key={task.id}
            task={task}
            stateLabel="recurring"
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
          />
        ))}
      </BoardSection>

      <BoardSection
        emoji="📋"
        title="Weekly board"
        count={weeklyTasks.length}
        emptyText="No chores on the weekly board."
      >
        <MemberWeeklyTaskGrid
          tasks={weeklyTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onCompleteTask={onCompleteTask}
          getTaskDueDate={getTaskDueDate}
        />
      </BoardSection>

      <BoardSection
        emoji="✅"
        title="Recently completed"
        count={recentlyCompletedItems.length}
        emptyText="No recent completions yet."
      >
        {recentlyCompletedItems.map((task) => (
          <MemberDashboardTaskCard
            key={task.id}
            task={task}
            stateLabel="done"
            showCompleted
            selected={selectedTaskId === task.id}
            onSelect={onSelectTask}
            onComplete={onCompleteTask}
            getTaskDueDate={getTaskDueDate}
          />
        ))}
      </BoardSection>
    </div>
  );
}
