import { useChoreSwipe } from "./useChoreSwipe";

/** Swipe-to-complete for member task cards (reuses chore swipe + analytics). */
export function useMemberTaskSwipe({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return useChoreSwipe({
    surface: "member:dashboard",
    onSwipeRight: onComplete,
  });
}
