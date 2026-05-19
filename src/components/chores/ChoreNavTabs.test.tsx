import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoreNavTabs } from "./ChoreNavTabs";

describe("ChoreNavTabs", () => {
  it("exposes tablist semantics and aria-selected", () => {
    const onChange = jest.fn();
    render(<ChoreNavTabs active="home" onChange={onChange} />);
    const tablist = screen.getByRole("tablist", { name: "Chore sections" });
    expect(tablist).toBeInTheDocument();
    const home = screen.getByRole("tab", { name: "Home" });
    expect(home).toHaveAttribute("aria-selected", "true");
    expect(home).toHaveAttribute("aria-controls", "chore-panel-home");
    expect(screen.getByRole("tab", { name: "Dashboard" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("moves selection with ArrowRight keyboard", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChoreNavTabs active="home" onChange={onChange} />);
    const home = screen.getByRole("tab", { name: "Home" });
    home.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("dashboard");
  });
});
