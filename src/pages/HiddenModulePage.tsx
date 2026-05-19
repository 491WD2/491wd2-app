import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";

type Props = {
  /** Short label shown in the card header for legacy deep links. */
  title: string;
  onGoHome: () => void;
  onGoSettings: () => void;
};

/** Shown when a legacy route is visited directly; no data is deleted. */
export function HiddenModulePage({ title, onGoHome, onGoSettings }: Props) {
  return (
    <Card>
      <CardHeader title={title} eyebrow="Not in household navigation" />
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        This area is no longer part of the main app layout. Your records are still in this device
        and in backups/imports.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onGoHome} type="button" variant="primary">
          Back to Home
        </Button>
        <Button onClick={onGoSettings} type="button" variant="secondary">
          Open Settings
        </Button>
      </div>
    </Card>
  );
}
