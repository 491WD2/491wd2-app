/**
 * Cross-tab chore sync — BroadcastChannel + custom event (storage events only fire in other tabs).
 */
const CHANNEL_NAME = "491wd-chore-realtime";
const MEMBER_CHANGED = "491wd-chore-member-changed";

export type ChoreRealtimeMessage = { type: "chore-updated"; ts: number };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcastChoreUpdate(): void {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({ type: "chore-updated", ts: Date.now() } satisfies ChoreRealtimeMessage);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("491wd-chore-storage-sync"));
  }
}

export function subscribeChoreRealtime(onUpdate: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const ch = getChannel();
  const onMessage = (ev: MessageEvent<ChoreRealtimeMessage>) => {
    if (ev.data?.type === "chore-updated") {
      onUpdate();
    }
  };
  const onCustom = () => onUpdate();
  const onMember = () => onUpdate();

  ch?.addEventListener("message", onMessage);
  window.addEventListener("491wd-chore-storage-sync", onCustom);
  window.addEventListener(MEMBER_CHANGED, onMember);

  return () => {
    ch?.removeEventListener("message", onMessage);
    window.removeEventListener("491wd-chore-storage-sync", onCustom);
    window.removeEventListener(MEMBER_CHANGED, onMember);
  };
}
