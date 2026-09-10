import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PantryAdminUxChrome } from "./PantryAdminUxChrome";

const noop = () => undefined;

describe("PantryAdminUxChrome", () => {
  it("surfaces inventory health and keeps Add Item as the primary action", async () => {
    const user = userEvent.setup();
    const onAddItem = jest.fn();
    const onStatFilter = jest.fn();
    render(
      <PantryAdminUxChrome
        totalItems={24}
        lowStock={16}
        outOfStock={2}
        useSoon={3}
        recentlyUpdated={4}
        purchasedToAdd={1}
        storageAreaCount={5}
        zoneSummaries={[]}
        activeZone="all"
        onSelectZone={noop}
        onAddItem={onAddItem}
        onScanItem={noop}
        onOpenShopping={noop}
        onStatFilter={onStatFilter}
        searchText=""
        setSearchText={noop}
        categoryFilter="all"
        setCategoryFilter={noop}
        locationFilter="all"
        setLocationFilter={noop}
        statusFilter="all"
        setStatusFilter={noop}
        sortBy="name"
        setSortBy={noop}
        categories={[]}
        locations={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Pantry & Inventory/i })).toBeInTheDocument();
    expect(screen.getByText(/2 out · 16 low · 3 use soon · 24 in stock/i)).toBeInTheDocument();
    expect(screen.queryByText(/Estimated pantry value/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Use soon/i }));
    expect(onStatFilter).toHaveBeenCalledWith("soon");
    await user.click(screen.getByRole("button", { name: /^Add Item$/i }));
    expect(onAddItem).toHaveBeenCalledTimes(1);
  });
});
