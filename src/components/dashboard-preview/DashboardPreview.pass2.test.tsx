import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DashboardPreview } from "./DashboardPreview";
import { createDefaultFamilyData } from "../../data/familyData";

function PreviewHarness() {
  const [data, setData] = useState(() => {
    const base = createDefaultFamilyData();
    base.adminSettings.householdName = "Roskens Household";
    return base;
  });
  const navigateWithinApp = jest.fn();

  return (
    <DashboardPreview
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

describe("DashboardPreview Pass 2 smoke", () => {
  it("renders live dashboard sections without placeholder copy", () => {
    render(<PreviewHarness />);
    expect(screen.getByTestId("dashboard-preview-root")).toBeInTheDocument();
    expect(
      screen.queryByText(/Preview data will connect in the next implementation pass/i),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Dashboard utility band/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primary dashboard widgets/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Family$/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Family access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tap to open/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hershel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lorraine/i)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Quick add/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Today's kitchen duty/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Kitchen today/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Shopping$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Upcoming$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pantry & storage/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Chores$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Messages$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Today's household focus/i)).not.toBeInTheDocument();
  });

  it("navigates via Quick Add grocery route contract", async () => {
    const user = userEvent.setup();
    const navigateWithinApp = jest.fn();
    const base = createDefaultFamilyData();

    render(
      <DashboardPreview
        data={base}
        setData={jest.fn()}
        navigateWithinApp={navigateWithinApp}
        onOpenPantry={jest.fn()}
        onOpenShopping={jest.fn()}
        onOpenCalendar={jest.fn()}
        onOpenTasks={jest.fn()}
      />,
    );

    const quickAdd = screen.getByRole("region", { name: /Quick add/i });
    await user.click(within(quickAdd).getByRole("button", { name: /Add shopping/i }));
    expect(navigateWithinApp).toHaveBeenCalledWith("/quick-add?type=grocery&name=");
    expect(navigateWithinApp).toHaveBeenCalledWith("/shopping");
  });

  it("keeps preview navigation links and six widgets available", async () => {
    const user = userEvent.setup();
    const navigateWithinApp = jest.fn();
    const base = createDefaultFamilyData();

    render(
      <DashboardPreview
        data={base}
        setData={jest.fn()}
        navigateWithinApp={navigateWithinApp}
        onOpenPantry={jest.fn()}
        onOpenShopping={jest.fn()}
        onOpenCalendar={jest.fn()}
        onOpenTasks={jest.fn()}
      />,
    );

    const rail = screen.getByLabelText(/Preview navigation/i);
    expect(within(rail).getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Shopping" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Storage" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Calendar" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Messages" })).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Settings" })).toBeInTheDocument();

    await user.click(within(rail).getByRole("button", { name: "Shopping" }));
    expect(navigateWithinApp).toHaveBeenCalledWith("/shopping");
  });

  it("adds a shopping item through the existing household action", async () => {
    const user = userEvent.setup();
    const setData = jest.fn();
    const data = createDefaultFamilyData();

    render(
      <DashboardPreview
        data={data}
        setData={setData}
        navigateWithinApp={jest.fn()}
        onOpenPantry={jest.fn()}
        onOpenShopping={jest.fn()}
        onOpenCalendar={jest.fn()}
        onOpenTasks={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Quick add shopping item/i), "Oat Milk");
    await user.click(screen.getByRole("button", { name: /Add shopping item/i }));

    expect(setData).toHaveBeenCalled();
    const next = setData.mock.calls[0][0];
    expect(next.shopping.some((item: { name: string }) => item.name === "Oat Milk")).toBe(true);
    expect(next.shopping.filter((item: { name: string }) => item.name === "Milk")).toHaveLength(1);
  });

  it("completes a today chore through the existing household action", async () => {
    const user = userEvent.setup();
    const setData = jest.fn();
    const todayIso = new Date().toISOString().slice(0, 10);
    const data = createDefaultFamilyData();
    data.tasks = [
      {
        id: "chore-preview-1",
        title: "Unload dishwasher",
        owner: "",
        type: "chore",
        status: "Not Started",
        priority: "Medium",
        frequency: "daily",
        dueDate: todayIso,
        lastCompletedDate: "",
        nextDueDate: todayIso,
        assignedMemberId: "",
        createdAt: `${todayIso}T00:00:00.000Z`,
        updatedAt: `${todayIso}T00:00:00.000Z`,
      },
    ];

    render(
      <DashboardPreview
        data={data}
        setData={setData}
        navigateWithinApp={jest.fn()}
        onOpenPantry={jest.fn()}
        onOpenShopping={jest.fn()}
        onOpenCalendar={jest.fn()}
        onOpenTasks={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Unload dishwasher/i }));
    expect(setData).toHaveBeenCalled();
    const updater = setData.mock.calls[0][0];
    const next = typeof updater === "function" ? updater(data) : updater;
    const chore = next.tasks.find((task: { id: string }) => task.id === "chore-preview-1");
    expect(chore.lastCompletedDate).toBe(todayIso);
  });
});
