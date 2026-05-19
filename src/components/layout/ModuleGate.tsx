import type { ReactNode } from "react";
import type { AdminSettings, ModuleKey } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";

const moduleLabels: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  family: "Members",
  tasks: "Cleaning",
  projects: "Workspace",
  pantry: "Pantry & Inventory",
  shopping: "Shopping",
  calendar: "Calendar",
  planner: "Calendar",
  docs: "Notes",
};

type ModuleGateProps = {
  children: ReactNode;
  moduleKey: ModuleKey;
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
};

export function ModuleGate({
  children,
  moduleKey,
  moduleVisibility,
  onOpenDashboard,
  onOpenSettings,
}: ModuleGateProps) {
  const isEnabled =
    moduleKey === "dashboard" || moduleVisibility?.[moduleKey] !== false;

  if (isEnabled) {
    return children;
  }

  return (
    <Card>
      <CardHeader
        title={`${moduleLabels[moduleKey]} is disabled`}
        eyebrow="Module visibility"
      />
      <div className="space-y-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          This module is currently hidden in Settings. Its data has not been
          deleted, and you can turn the module back on at any time.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onOpenDashboard} variant="primary">
            Back to Dashboard
          </Button>
          <Button onClick={onOpenSettings} variant="secondary">
            Open Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
