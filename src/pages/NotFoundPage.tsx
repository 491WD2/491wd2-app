import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";

type NotFoundPageProps = {
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
};

export function NotFoundPage({
  onOpenDashboard,
  onOpenSettings,
}: NotFoundPageProps) {
  return (
    <Card>
      <CardHeader title="Page not found" eyebrow="Navigation" />
      <div className="space-y-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          This address is not part of this household workspace. Your saved data is unchanged.
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
