import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { SmartDashboardWidgetLayout, SmartDashboardWidgetSize } from "../../lib/smartDashboardLayout";
import { DASHBOARD_WIDGET_SIZE_OPTIONS } from "../../lib/dashboardLayoutPreferences";
import {
  SMARTHR_BORDER_DEFAULT,
  SMARTHR_CARD,
  SMARTHR_DASH_BODY_PARAGRAPH,
  SMARTHR_LABEL,
  SMARTHR_TITLE,
  SMARTHR_HUB_LAYOUT_CHECKBOX,
  SMARTHR_HUB_LAYOUT_DONE_BTN,
  SMARTHR_HUB_LAYOUT_DRAG_RING,
  SMARTHR_HUB_LAYOUT_EDIT_BTN,
  SMARTHR_HUB_LAYOUT_GRIP_ACTIVE,
  SMARTHR_HUB_LAYOUT_GRIP_DISABLED,
  SMARTHR_HUB_LAYOUT_ICON_BTN,
  SMARTHR_HUB_LAYOUT_RESET_GHOST,
  SMARTHR_HUB_LAYOUT_ROW_WELL,
  SMARTHR_HUB_LAYOUT_SELECT,
} from "../../lib/smarthrUi";
import { sortDashboardWidgets } from "../../lib/smartDashboardLayout";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

/** Phones: HTML5 drag is unreliable; keep keyboard-style ordering only. */
const DRAG_DISABLED_QUERY = "(max-width: 639px)";

type Props = {
  editLayout: boolean;
  onSetEditLayout: (next: boolean) => void;
  widgets: SmartDashboardWidgetLayout[];
  onWidgetVisibleChange: (id: string, visible: boolean) => void;
  onWidgetSizeChange: (id: string, size: SmartDashboardWidgetSize) => void;
  onMoveOrder: (id: string, dir: "up" | "down") => void;
  onReorderDrag: (fromIndex: number, toIndex: number) => void;
  onResetLayout: () => void;
  /** Shown in reset dialog — e.g. "Family" or "Stella". */
  layoutViewLabel?: string;
};

function useDragDropEnabled(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DRAG_DISABLED_QUERY).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(DRAG_DISABLED_QUERY);
    const handler = () => setNarrow(mq.matches);
    mq.addEventListener("change", handler);
    setNarrow(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return !narrow;
}

export function DashboardLayoutControls({
  editLayout,
  onSetEditLayout,
  widgets,
  onWidgetVisibleChange,
  onWidgetSizeChange,
  onMoveOrder,
  onReorderDrag,
  onResetLayout,
  layoutViewLabel = "Family",
}: Props) {
  const [resetOpen, setResetOpen] = useState(false);
  const dragDropEnabled = useDragDropEnabled();
  const dragSourceIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sorted = sortDashboardWidgets(widgets);

  function confirmReset() {
    onResetLayout();
    setResetOpen(false);
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    dragSourceIndexRef.current = index;
    setDraggingIndex(index);
    try {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
    } catch {
      /* Safari subset */
    }
  }

  function handleDragEnd() {
    dragSourceIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    if (!dragDropEnabled) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragSourceIndexRef.current;
    handleDragEnd();
    if (from === null || from === dropIndex) {
      return;
    }
    onReorderDrag(from, dropIndex);
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {!editLayout ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className={SMARTHR_HUB_LAYOUT_EDIT_BTN}
              onClick={() => onSetEditLayout(true)}
              aria-expanded={false}
              aria-controls={undefined}
            >
              Edit layout
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              SMARTHR_CARD,
              "flex flex-col gap-2 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4",
            )}
            role="region"
            aria-label="Dashboard layout editing"
          >
            <p className={cn("text-[13px] leading-snug sm:max-w-[55%]", SMARTHR_LABEL)}>
              You’re editing tile order, size, and visibility. Changes save automatically.
            </p>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                className={SMARTHR_HUB_LAYOUT_DONE_BTN}
                onClick={() => onSetEditLayout(false)}
                aria-label="Finish editing dashboard layout"
              >
                Done editing
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={SMARTHR_HUB_LAYOUT_RESET_GHOST}
                onClick={() => setResetOpen(true)}
              >
                Reset layout…
              </Button>
            </div>
          </div>
        )}

        {editLayout ? (
          <section
            className={cn(SMARTHR_CARD, "p-4 sm:p-5")}
            aria-labelledby="dashboard-layout-editor-title"
          >
            <h2
              id="dashboard-layout-editor-title"
              className={cn("text-[16px] font-semibold sm:text-[17px]", SMARTHR_TITLE)}
            >
              Dashboard tiles
            </h2>
            <p className={cn("mt-1 text-[13px]", SMARTHR_LABEL)}>
              Show or hide modules and pick width on large screens. On wider screens, drag the grip to reorder; on
              small phones use Move up and Move down.
            </p>
            <ul className="mt-4 flex flex-col gap-3" role="list">
              {sorted.map((w, index) => {
                const atTop = index === 0;
                const atBottom = index === sorted.length - 1;
                const canDragRow = dragDropEnabled && w.visible;
                const isDragging = draggingIndex === index;
                const isOver = dragOverIndex === index && draggingIndex !== index;

                return (
                  <li
                    key={w.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={cn("rounded-[8px] transition-shadow", isOver && SMARTHR_HUB_LAYOUT_DRAG_RING)}
                  >
                    <div className={cn(SMARTHR_HUB_LAYOUT_ROW_WELL, isDragging && "opacity-60")}>
                      <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
                        <div
                          className={
                            canDragRow
                              ? SMARTHR_HUB_LAYOUT_GRIP_ACTIVE
                              : cn(
                                  "flex shrink-0 touch-none flex-col justify-center rounded-[6px] border bg-white px-1 py-2 shadow-sm select-none",
                                  SMARTHR_BORDER_DEFAULT,
                                  SMARTHR_HUB_LAYOUT_GRIP_DISABLED,
                                )
                          }
                          draggable={canDragRow}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          aria-grabbed={isDragging ? true : undefined}
                          aria-label={`Drag to reorder ${w.title}`}
                          aria-describedby={`dash-row-${w.id}`}
                        >
                          <GripVertical className="mx-auto h-5 w-5" aria-hidden strokeWidth={2} />
                          <span className="sr-only">Drag</span>
                        </div>

                        <input
                          type="checkbox"
                          id={`dash-vis-${w.id}`}
                          className={SMARTHR_HUB_LAYOUT_CHECKBOX}
                          checked={w.visible}
                          onChange={(e) => onWidgetVisibleChange(w.id, e.target.checked)}
                          aria-describedby={`dash-row-${w.id}`}
                        />
                        <div className="min-w-0" id={`dash-row-${w.id}`}>
                          <label
                            htmlFor={`dash-vis-${w.id}`}
                            className={cn("cursor-pointer text-[14px] font-semibold", SMARTHR_TITLE)}
                          >
                            {w.title}
                          </label>
                          <p className={cn("mt-0.5 text-[12px]", SMARTHR_LABEL)}>
                            {w.visible ? "Shown on Home" : "Hidden"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <label className={cn("sr-only")} htmlFor={`dash-size-${w.id}`}>
                          Width for {w.title}
                        </label>
                        <select
                          id={`dash-size-${w.id}`}
                          value={w.size}
                          onChange={(e) =>
                            onWidgetSizeChange(w.id, e.target.value as SmartDashboardWidgetSize)
                          }
                          disabled={!w.visible}
                          className={SMARTHR_HUB_LAYOUT_SELECT}
                        >
                          {DASHBOARD_WIDGET_SIZE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={!w.visible || atTop}
                            className={SMARTHR_HUB_LAYOUT_ICON_BTN}
                            aria-label={`Move ${w.title} up`}
                            onClick={() => onMoveOrder(w.id, "up")}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            disabled={!w.visible || atBottom}
                            className={SMARTHR_HUB_LAYOUT_ICON_BTN}
                            aria-label={`Move ${w.title} down`}
                            onClick={() => onMoveOrder(w.id, "down")}
                          >
                            <ChevronDown className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      <Modal
        open={resetOpen}
        title={`Reset ${layoutViewLabel} Home layout to default?`}
        variant="smarthr"
        onClose={() => setResetOpen(false)}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={confirmReset}>
              Reset Layout
            </Button>
          </div>
        }
      >
        <p className={SMARTHR_DASH_BODY_PARAGRAPH}>
          Only tile order, sizes, and visibility for this view are cleared. Other views and household data are not
          changed.
        </p>
      </Modal>
    </>
  );
}
