import { Home } from "lucide-react";
import { Button } from "../components/ui/Button";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn } from "../lib/utils";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#0f172a] [-webkit-font-smoothing:antialiased]";
const CARD =
  "rounded-[12px] border border-[#cbd5e1] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.08)] sm:p-5";

type Props = {
  title: string;
  eyebrow?: string;
  description: string;
  tips?: string[];
  relatedHref?: string;
  relatedLabel?: string;
  onOpenHome?: () => void;
  navigateWithinApp?: (href: string) => void;
};

/**
 * Calm sidebar tool surface for modules kept off the wake/command page.
 * Does not change FamilyData; preserves routes for Photos / Routines / etc.
 */
export function HouseholdSidebarToolPage({
  title,
  eyebrow = "Household tools",
  description,
  tips = [],
  relatedHref,
  relatedLabel,
  onOpenHome,
  navigateWithinApp,
}: Props) {
  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell className={cn(DS_MAIN_COLUMN, "pb-10 pt-2")}>
        <ModuleWorkspaceHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={
            onOpenHome ? (
              <Button type="button" variant="secondary" onClick={onOpenHome}>
                <Home className="h-4 w-4" />
                Home
              </Button>
            ) : null
          }
        />
        <section className={CARD}>
          <p className="text-sm font-medium text-[#475569]">
            This module stays in the sidebar so the wake page stays focused on daily household
            needs. Your existing data is unchanged.
          </p>
          {tips.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-medium text-[#334155]">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {relatedHref && relatedLabel && navigateWithinApp ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => navigateWithinApp(relatedHref)}
              >
                {relatedLabel}
              </Button>
            ) : null}
            {onOpenHome ? (
              <Button type="button" variant="secondary" onClick={onOpenHome}>
                Back to Home
              </Button>
            ) : null}
          </div>
        </section>
      </WorkspacePageShell>
    </div>
  );
}

export default HouseholdSidebarToolPage;
