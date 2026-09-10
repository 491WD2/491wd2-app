import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShoppingAdminUxRow } from "./ShoppingAdminUxRow";
import type { GroceryCartLine } from "../../types/grocery";

const line: GroceryCartLine = {
  id: "line-1",
  productId: "prod-1",
  productName: "Milk",
  imageUrl: null,
  category: "Dairy",
  quantity: 1,
  unit: "gallon",
  store: "Safeway",
  notes: "",
  purchased: false,
};

describe("ShoppingAdminUxRow", () => {
  it("renders an active item and completes it through the existing handler", async () => {
    const user = userEvent.setup();
    const onMarkPurchased = jest.fn();
    render(
      <ShoppingAdminUxRow
        line={line}
        mode="need"
        dueSoon
        isRestock
        linkedPantryName="Organic Valley Whole Milk"
        onMarkPurchased={onMarkPurchased}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("Due")).toBeInTheDocument();
    expect(screen.getByText("Restock")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark Milk purchased" }));
    expect(onMarkPurchased).toHaveBeenCalledTimes(1);
  });
});
