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

describe("Stage N1A Home workspace", () => {
  it("renders greeting, household name, and clock", () => {
    render(<HomeHarness />);
    expect(screen.getByRole("heading", { level: 1, name: /Roskens Household/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Greeting and clock")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Family members" })).toBeInTheDocument();
  });

  it("leads with kitchen duty and calendar; storage is a link only", () => {
    render(<HomeHarness />);
    expect(screen.getByRole("heading", { name: /Today’s kitchen duty/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Upcoming$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Food remaining/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Your storage/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pantry & Storage/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Track pantry stock, fridge items, and freezer storage/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Open storage$/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Quick links" })).toBeInTheDocument();
    expect(screen.getByLabelText("Today at a glance")).toBeInTheDocument();
  });

  it("does not render the old module gallery or family box", () => {
    render(<HomeHarness />);
    expect(screen.queryByRole("navigation", { name: "Modules" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Sample Member/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notion AI/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Quick Add$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Today$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Messages$/i })).toBeInTheDocument();
  });

  it("renders today chore data under kitchen duty and excludes inventing sample tasks", () => {
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
              id: "planner-sample-should-not-show-in-today",
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
    const kitchenHeading = screen.getByRole("heading", { name: /Today’s kitchen duty/i });
    const kitchenSection = kitchenHeading.closest(".fh-fridge-home__kitchen");
    expect(kitchenSection).not.toBeNull();
    expect(within(kitchenSection as HTMLElement).queryByText("Hidden planner-only event")).not.toBeInTheDocument();
    expect(within(kitchenSection as HTMLElement).getByText("Wipe kitchen counters")).toBeInTheDocument();
    expect(screen.queryByText(/Sample chore/i)).not.toBeInTheDocument();
  });

  it("renders Upcoming planner data from live records", () => {
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
        })}
      />,
    );
    expect(screen.getByText("Nothing due for today yet.")).toBeInTheDocument();
    expect(screen.getByText("No upcoming events on the planner.")).toBeInTheDocument();
    expect(screen.getByText("Shopping list is clear.")).toBeInTheDocument();
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
