import { memo, useEffect, useState } from "react";
import { choreString } from "../../lib/choreLocale";
import { isBrowserOffline, readChoreOfflineSnapshot } from "../../lib/choreOfflineSnapshot";

/** Subtle banner when the kiosk is offline but a local snapshot exists. */
export const ChoreOfflineBanner = memo(function ChoreOfflineBanner() {
  const [offline, setOffline] = useState(isBrowserOffline);
  const [hasSnapshot, setHasSnapshot] = useState(() => readChoreOfflineSnapshot() !== null);

  useEffect(() => {
    const sync = () => {
      setOffline(isBrowserOffline());
      setHasSnapshot(readChoreOfflineSnapshot() !== null);
    };
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline || !hasSnapshot) {
    return null;
  }

  return (
    <p className="wd-chore-hh__offline-banner" role="status">
      {choreString("offlineBanner")}
    </p>
  );
});
