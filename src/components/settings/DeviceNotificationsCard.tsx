import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import {
  browserNotificationsSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotificationTest,
} from "../../lib/deviceNotifications";

export function DeviceNotificationsCard() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && browserNotificationsSupported()
      ? getBrowserNotificationPermission()
      : "unsupported",
  );

  useEffect(() => {
    if (!browserNotificationsSupported()) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  async function onRequest() {
    const r = await requestBrowserNotificationPermission();
    setPerm(r);
  }

  function onTest() {
    const ok = showBrowserNotificationTest(
      "FamilySite_491",
      "Test alert — if you see this, device notifications are working.",
    );
    if (!ok) {
      window.alert(
        "Allow notifications in your browser for this site, then try again.",
      );
    }
  }

  const statusLine =
    perm === "unsupported"
      ? "This browser does not support in-browser alerts."
      : perm === "granted"
        ? "Permission granted. We only show these when you allow them in your browser."
        : perm === "denied"
          ? "Notifications are blocked. Change the site permission in your browser settings if you want device alerts."
          : "We have not asked yet — tap below to allow.";

  return (
    <Card tone="light">
      <CardHeader tone="light" title="Phone & tablet alerts" eyebrow="This device" />
      <p className="mb-4 text-sm leading-6 text-[#575757]">
        Your alerts still appear in the app. Optional browser notifications help on phones and tablets
        when the tab is in the background — no SMS, no accounts, and nothing leaves this device without
        your permission.
      </p>
      <p className="mb-4 rounded-lg border border-[#ededed] bg-[#fafafa] px-3 py-2 text-sm text-[#575757]">
        <span className="font-medium text-[#1f1f1f]">Status: </span>
        {statusLine}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={perm === "unsupported" || perm === "granted"}
          onClick={() => void onRequest()}
        >
          Request notification permission
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={perm !== "granted"}
          onClick={onTest}
        >
          Send test alert
        </Button>
      </div>
    </Card>
  );
}
