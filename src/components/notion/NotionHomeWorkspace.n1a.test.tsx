import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { NotionHomeWorkspace } from "../notion/NotionHomeWorkspace";
import {
  createDefaultFamilyData,
  type FamilyData,
  type PlannerEvent,
  type Task,
} from "../../data/familyData";

function HomeHarness({
  initial,
}: {
  initial?: (data: FamilyData) => FamilyData;
}) {
  const [data, setData] = useState(() => {
    const base = createDefaultFamilyData();
    base.adminSettings.householdName = "Roskens Household";
    return initial ? initial(base) : base;
  });
  const navigateWithinApp = jest.fn();

  return (
    <NotionHomeWorkspace
      data={data}
      setData={setData}
      navigateWithinApp={navigateWithinApp}
      onOpenPantry={jest.fn()}
      onOpenShopping={jest.fn()}
      onOpenCalendar={jest.fn()}
      onOpenTasks={jest.fn()}
    />
  );
}

function todayIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function headingOrder(...names: RegExp[]) {
  const headings = names.map((name) => screen.getByRole("heading", { name }));
  for (let i = 0; i < headings.length - 1; i += 1) {
    expect(
      headings[i].compareDocumentPosition(headings[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
}

describe("Home priority dashboard", () => {
  it("renders household identity, live clock, kitchen assignment, and weather", () => {
    render(<HomeHarness />);
    expect(screen.getByText("Roskens Household")).toBeInTheDocument();
    expect(screen.getByLabelText("Date, time, kitchen, and weather")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Who’s on kitchen/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Weather placeholder")).toBeInTheDocument();
    expect(screen.getByText(/forecast not connected/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Family members" })).not.toBeInTheDocument();
  });

  it("puts shopping first, then pantry, events, calendar, and secondary modules", () => {
    render(<HomeHarness />);
    headingOrder(
      /^Shopping$/i,
      /^Pantry$/i,
      /What’s happening next/i,
      /^Calendar$/i,
      /^Messages$/i,
      /^Chores$/i,
    );
    expect(screen.getByRole("button", { name: /^Open shopping$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Open pantry$/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Quick add" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Today’s kitchen duty/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Pantry & Storage/i })).not.toBeInTheDocument();
  });

  it("does not render the old module gallery or family box", () => {
    render(<HomeHarness />);
    expect(screen.queryByRole("navigation", { name: "Modules" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Sample Member/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notion AI/i)).not.toBeInTheDocument();
  });

  it("keeps today’s chores in the secondary chores card", () => {
    const dueToday: Task = {
      id: "chore-today-1",
      title: "Wipe kitchen counters",
      status: "Today",
      type: "chore",
      category: "Kitchen",
      priority: "Medium",
      frequency: "daily",
      owner: "",
      assignedMemberId: "member-1",
      dueDate: todayIso(),
      lastCompletedDate: "",
      nextDueDate: todayIso(),
      notes: "",
      checklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    render(
      <HomeHarness
        initial={(data) => ({
          ...data,
          tasks: [dueToday],
          planner: [
            {
              id: "planner-sample-should-not-show-in-chores",
              title: "Hidden planner-only event",
              date: todayIso(),
              time: "10:00",
              category: "Family",
              assignedMemberId: "",
              assignedPerson: "Family",
              notes: "",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Wipe kitchen counters")).toBeInTheDocument();
    const choresHeading = screen.getByRole("heading", { name: /^Chores$/i });
    const choresSection = choresHeading.closest(".fh-fridge-home__kitchen");
    expect(choresSection).not.toBeNull();
    expect(
      within(choresSection as HTMLElement).queryByText("Hidden planner-only event"),
    ).not.toBeInTheDocument();
    expect(within(choresSection as HTMLElement).getByText("Wipe kitchen counters")).toBeInTheDocument();
    expect(screen.getByText("Hidden planner-only event")).toBeInTheDocument();
    expect(screen.queryByText(/Sample chore/i)).not.toBeInTheDocument();
  });

  it("renders upcoming planner data from live records", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event: PlannerEvent = {
      id: "evt-1",
      title: "Family dentist visit",
      date: todayIso(tomorrow),
      time: "14:00",
      category: "Medical",
      assignedMemberId: "",
      assignedPerson: "Family",
      notes: "",
    };
    render(
      <HomeHarness
        initial={(data) => ({
          ...data,
          planner: [event],
        })}
      />,
    );
    expect(screen.getByText("Family dentist visit")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("shows honest empty states without sample records", () => {
    render(
      <HomeHarness
        initial={(data) => ({
          ...data,
          tasks: [],
          planner: [],
          messageBoard: [],
          shopping: [],
          pantry: [],
        })}
      />,
    );
    expect(screen.getByText("Nothing due for today yet.")).toBeInTheDocument();
    expect(screen.getByText("No upcoming events on the planner.")).toBeInTheDocument();
    expect(screen.getByText("Shopping list is clear.")).toBeInTheDocument();
    expect(screen.getByText("Open pantry to start tracking household inventory.")).toBeInTheDocument();
    expect(screen.queryByText(/Demo task/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("keeps shopping quick-add wired to live mutation path", async () => {
    const user = userEvent.setup();
    function MutableHome() {
      const [data, setData] = useState(() => {
        const base = createDefaultFamilyData();
        base.adminSettings.householdName = "Roskens Household";
        base.shopping = [];
        return base;
      });
      return (
        <NotionHomeWorkspace
          data={data}
          setData={setData}
          navigateWithinApp={jest.fn()}
          onOpenPantry={jest.fn()}
          onOpenShopping={jest.fn()}
          onOpenCalendar={jest.fn()}
          onOpenTasks={jest.fn()}
        />
      );
    }
    render(<MutableHome />);
    await user.type(screen.getByLabelText("Quick add shopping item"), "Oat milk");
    await user.click(screen.getByRole("button", { name: "Add shopping item" }));
    expect(screen.getByText("Oat milk")).toBeInTheDocument();
  });
});
