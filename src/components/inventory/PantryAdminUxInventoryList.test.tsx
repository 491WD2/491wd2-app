import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PantryAdminUxInventoryList } from "./PantryAdminUxInventoryList";
import type { PantryItem } from "../../data/familyData";

function item(partial: Partial<PantryItem> & Pick<PantryItem, "id" | "name" | "status">): PantryItem {
  return {
    quantity: "1",
    category: "Dairy",
    storageArea: "Kitchen Fridge",
    location: "Kitchen Fridge",
    isStaple: false,
    tags: [],
    createdAt: "2026-09-01T00:00:00.000Z",
    lastUpdated: "2026-09-01T00:00:00.000Z",
    ...partial,
  };
}

describe("PantryAdminUxInventoryList", () => {
  it("shows a useful empty state with add action", async () => {
    const user = userEvent.setup();
    const onAddItem = jest.fn();
    render(
      <PantryAdminUxInventoryList
        items={[]}
        adjustItemQuantity={jest.fn()}
        addInventoryItemToShopping={jest.fn()}
        onEditItem={jest.fn()}
        onUpdateStock={jest.fn()}
        onAddItem={onAddItem}
      />,
    );
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add pantry item" }));
    expect(onAddItem).toHaveBeenCalledTimes(1);
  });

  it("renders out/low/use-soon and on-list status without changing restock behavior", async () => {
    const user = userEvent.setup();
    const addToShopping = jest.fn();
    render(
      <div className="fh-ops-bright">
        <PantryAdminUxInventoryList
          items={[
            item({ id: "1", name: "Rice", status: "Out" }),
            item({ id: "2", name: "Oats", status: "Low", useSoonMarked: true }),
          ]}
          adjustItemQuantity={jest.fn()}
          addInventoryItemToShopping={addToShopping}
          onEditItem={jest.fn()}
          onUpdateStock={jest.fn()}
          shoppingLinkedIds={new Set(["1"])}
        />
      </div>,
    );
    expect(screen.getAllByText("Rice").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/On shopping list/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Use soon/i).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Already on shopping list" })[0]);
    expect(addToShopping).toHaveBeenCalledTimes(1);
  });
});
