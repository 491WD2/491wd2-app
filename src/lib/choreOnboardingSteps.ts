import type { ChoreOnboardingStep } from "../types/choreOnboarding";

export const CHORE_ONBOARDING_STEPS: readonly ChoreOnboardingStep[] = [
  {
    id: "welcome",
    kind: "modal",
    title: "Welcome to your chore kiosk",
    body: "This short tour shows how to complete tasks, use smart suggestions, and assign chores on a shared schedule. Takes about one minute.",
  },
  {
    id: "tabs",
    kind: "spotlight",
    title: "Four places to work",
    body: "Home is today’s list. Dashboard shows the whole household. Schedule is the week and assign board. Users is per-person tasks and notes.",
    target: "tabs",
    tab: "home",
  },
  {
    id: "complete-task",
    kind: "spotlight",
    title: "Complete a chore",
    body: "Tap Done on any task, or swipe left on the card. Completions update everywhere instantly — no refresh needed.",
    target: "today-tasks",
    tab: "home",
  },
  {
    id: "ai-suggestions",
    kind: "spotlight",
    title: "Smart suggestions",
    body: "Personalized tips based on your schedule and history. Tap an action to jump to the right tab or task.",
    target: "ai-suggestions",
    tab: "home",
  },
  {
    id: "schedule-week",
    kind: "spotlight",
    title: "Week schedule",
    body: "Pick a day pill to see that day’s tasks. Use Prev, This week, and Next to move through the calendar.",
    target: "schedule-mode",
    tab: "schedule",
    openAssignBoard: false,
  },
  {
    id: "schedule-assign",
    kind: "spotlight",
    title: "Drag to assign",
    body: "Open Assign, then drag chores from the pool into a household member’s column. Touch and hold, then drop.",
    target: "assign-board",
    tab: "schedule",
    openAssignBoard: true,
  },
  {
    id: "finish",
    kind: "modal",
    title: "You’re ready",
    body: "Come back anytime from the Tour button in the header. Enjoy your chore kiosk!",
  },
] as const;
