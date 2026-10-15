import { render, screen, waitFor, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { formatLongDate, toISODate } from "~/lib/dates";
import { Calendar } from "./calendar";
import { DateField } from "./date-picker";

const day = (iso: string) => screen.getByRole("button", { name: formatLongDate(iso) });

function renderCalendar(props: { value?: string | null; min?: string; max?: string } = {}) {
  const picked: string[] = [];
  render(() => (
    <Calendar value={props.value ?? null} min={props.min} max={props.max} onSelect={(iso) => picked.push(iso)} />
  ));
  return picked;
}

describe("Calendar", () => {
  it("shows the selected date's month, Monday first, and marks today", () => {
    renderCalendar({ value: "2026-10-15" });
    expect(screen.getByRole("grid")).toHaveAccessibleName(
      new Date(2026, 9, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveAccessibleName(new Date(2024, 0, 1).toLocaleDateString(undefined, { weekday: "long" }));
    expect(day("2026-10-15").parentElement).toHaveAttribute("aria-selected", "true");
    expect(day(toISODate(new Date()))).toHaveAttribute("aria-current", "date");
  });

  it("selects a day on click", async () => {
    const picked = renderCalendar({ value: "2026-10-15" });
    await userEvent.click(day("2026-10-20"));
    expect(picked).toEqual(["2026-10-20"]);
  });

  it("navigates months with the header buttons", async () => {
    renderCalendar({ value: "2026-10-15" });
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid")).toHaveAccessibleName(
      new Date(2026, 10, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    );
  });

  it("supports keyboard navigation and selection", async () => {
    const picked = renderCalendar({ value: "2026-10-15" });
    await waitFor(() => expect(day("2026-10-15")).toHaveFocus());

    await userEvent.keyboard("{ArrowRight}{ArrowDown}"); // +1 day, +1 week
    expect(day("2026-10-23")).toHaveFocus();
    await userEvent.keyboard("{Home}"); // Monday of that week
    expect(day("2026-10-19")).toHaveFocus();
    await userEvent.keyboard("{PageDown}"); // same day next month
    await waitFor(() => expect(day("2026-11-19")).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    expect(picked).toEqual(["2026-11-19"]);
  });

  it("disables days outside min/max", () => {
    renderCalendar({ value: "2026-10-15", min: "2026-10-10", max: "2026-10-20" });
    expect(day("2026-10-09")).toBeDisabled();
    expect(day("2026-10-10")).toBeEnabled();
    expect(day("2026-10-21")).toBeDisabled();
  });
});

describe("DateField", () => {
  function renderField(initial: string | null) {
    const [value, setValue] = createSignal(initial);
    render(() => <DateField label="Due date" value={value()} onChange={setValue} />);
    return value;
  }

  it("opens the calendar, picks a date and closes", async () => {
    const value = renderField("2026-10-15");
    await userEvent.click(screen.getByRole("button", { name: /^Due date:/ }));
    const popover = await screen.findByRole("dialog", { name: "Choose date" });

    await userEvent.click(within(popover).getByRole("button", { name: formatLongDate("2026-10-22") }));
    expect(value()).toBe("2026-10-22");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^Due date:/ })).toHaveTextContent(formatLongDate("2026-10-22"));
  });

  it("clears and picks today from the footer", async () => {
    const value = renderField("2026-10-15");
    await userEvent.click(screen.getByRole("button", { name: /^Due date:/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    expect(value()).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Due date: not set" }));
    await userEvent.click(await screen.findByRole("button", { name: "Today" }));
    expect(value()).toBe(toISODate(new Date()));
  });
});

describe("DateField keyboard", () => {
  it("Escape closes the picker and returns focus to the field", async () => {
    const [value, setValue] = createSignal<string | null>("2026-10-15");
    render(() => <DateField label="Due date" value={value()} onChange={setValue} />);
    const trigger = screen.getByRole("button", { name: /^Due date:/ });
    await userEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Choose date" });
    await waitFor(() => expect(day("2026-10-15")).toHaveFocus());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choose date" })).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
