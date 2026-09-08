import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  createDefaultFamilyData,
  type FamilyData,
  type MessageBoardItem,
} from "../data/familyData";
import { MessagesPage } from "./MessagesPage";

function MessagesHarness({
  initial,
}: {
  initial?: (data: FamilyData) => FamilyData;
}) {
  const [data, setData] = useState(() => {
    const base = createDefaultFamilyData();
    return initial ? initial(base) : base;
  });

  return <MessagesPage data={data} setData={setData} onOpenDashboard={jest.fn()} />;
}

function existingMessage(overrides: Partial<MessageBoardItem> = {}): MessageBoardItem {
  return {
    id: "msg-existing",
    title: "Library books",
    message: "Due Friday",
    category: "School",
    colorKey: "orange",
    priority: "normal",
    pinned: false,
    authorMemberId: "member-3",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("MessagesPage", () => {
  it("shows a polished empty state when messageBoard is empty", () => {
    render(<MessagesHarness />);
    expect(screen.getByRole("heading", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByText("No household messages yet")).toBeInTheDocument();
    expect(
      screen.getByText(/reminders, school updates, and family news/i),
    ).toBeInTheDocument();
  });

  it("renders an existing household message", () => {
    render(
      <MessagesHarness
        initial={(data) => ({
          ...data,
          messageBoard: [existingMessage()],
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Library books" })).toBeInTheDocument();
    expect(screen.getByText("Due Friday")).toBeInTheDocument();
    expect(screen.getByText(/Stella/i)).toBeInTheDocument();
  });

  it("creates a message through the composer", async () => {
    const user = userEvent.setup();
    render(<MessagesHarness />);

    await user.click(screen.getAllByRole("button", { name: /New message/i })[0]);
    await user.type(screen.getByLabelText("Title"), "Soccer practice");
    await user.type(screen.getByLabelText("Message"), "Bring water bottles");
    await user.click(screen.getByRole("button", { name: "Save message" }));

    expect(screen.getByRole("heading", { name: "Soccer practice" })).toBeInTheDocument();
    expect(screen.getByText("Bring water bottles")).toBeInTheDocument();
    expect(screen.queryByText("No household messages yet")).not.toBeInTheDocument();
  });

  it("edits an existing message", async () => {
    const user = userEvent.setup();
    render(
      <MessagesHarness
        initial={(data) => ({
          ...data,
          messageBoard: [existingMessage()],
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Library books returned");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("heading", { name: "Library books returned" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Library books" })).not.toBeInTheDocument();
  });

  it("deletes a message after confirm", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MessagesHarness
        initial={(data) => ({
          ...data,
          messageBoard: [existingMessage()],
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Delete Library books/i }));
    expect(screen.getByText("No household messages yet")).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalled();
  });

  it("marks a message important for Home selectors", async () => {
    const user = userEvent.setup();
    render(
      <MessagesHarness
        initial={(data) => ({
          ...data,
          messageBoard: [existingMessage()],
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Mark important" }));
    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove important" })).toBeInTheDocument();
  });
});
