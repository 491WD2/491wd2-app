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
    expect(screen.getByRole("heading", { name: /Family Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Family$/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Quick add/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Today's kitchen duty/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Kitchen today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kitchen ·/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search household/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Shopping$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pantry & storage/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Messages & alerts/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Today's household focus/i)).toBeInTheDocument();
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
});
