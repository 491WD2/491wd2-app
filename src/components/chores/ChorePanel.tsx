import type { ReactNode } from "react";
import { choreLayout } from "../../lib/choreUi";

export type ChorePanelProps = {
  title: string;
  children: ReactNode;
  /** Optional header action (e.g. link button) */
  action?: ReactNode;
  id?: string;
  "data-chore-tour"?: string;
};

/** White card section with title — used for task lists and member blocks. */
export function ChorePanel({ title, children, action, id, "data-chore-tour": dataChoreTour }: ChorePanelProps) {
  return (
    <section
      className={choreLayout.panel}
      id={id}
      data-chore-tour={dataChoreTour}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className={choreLayout.sectionHead}>
        <h3 id={id ? `${id}-title` : undefined}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
