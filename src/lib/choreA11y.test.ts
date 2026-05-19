import { chorePanelId, choreTabId } from "./choreA11y";

describe("choreA11y", () => {
  it("returns stable tab and panel ids", () => {
    expect(choreTabId("home")).toBe("chore-tab-home");
    expect(chorePanelId("schedule")).toBe("chore-panel-schedule");
  });
});
