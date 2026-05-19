import type { CleaningPageId } from "../../types/chore";
import { isChoreFlowHubId } from "./choreHub";
import { ChoreFlowRouter } from "./choreFlowViews";
import {
  CleaningChecklistPage,
  CleaningRoomsIndexPage,
  CleaningSuppliesPage,
} from "./cleaningShared";

export function CleaningRouter({
  page,
  roomSlug,
  onNavigate,
}: {
  page: CleaningPageId;
  roomSlug?: string;
  onNavigate: (path: string) => void;
}) {
  if (isChoreFlowHubId(page)) {
    return <ChoreFlowRouter page={page} onNavigate={onNavigate} />;
  }

  if (page === "supplies") {
    return <CleaningSuppliesPage onNavigate={onNavigate} />;
  }
  if (page === "rooms") {
    return <CleaningRoomsIndexPage onNavigate={onNavigate} />;
  }
  if (page === "room" && roomSlug) {
    return <CleaningChecklistPage pageId="room" roomSlug={roomSlug} onNavigate={onNavigate} />;
  }
  if (page === "room") {
    return <CleaningRoomsIndexPage onNavigate={onNavigate} />;
  }
  return <CleaningChecklistPage pageId={page} onNavigate={onNavigate} />;
}
