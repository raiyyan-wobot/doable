import { createMemo, createSignal, For, onMount } from "solid-js";
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonth,
  monthGrid,
  toISODate,
  weekdayIndex,
  weekdayLabels,
} from "~/lib/dates";
import { cn } from "~/lib/utils";
import { IconButton } from "./icon-button";

interface CalendarProps {
  /** Selected date ("YYYY-MM-DD"), or null. */
  value: string | null;
  onSelect: (iso: string) => void;
  /** Inclusive bounds; days outside are disabled. */
  min?: string;
  max?: string;
}

/**
 * M3 date picker calendar: month header with previous/next, Monday-first
 * weekday row, 6×7 day grid. Selected day = `primary` circle, today =
 * `primary` outline, 40dp day targets.
 *
 * Keyboard (WAI-ARIA grid pattern): arrows move by day/week, PageUp/PageDown
 * by month, Home/End to the start/end of the week, Enter/Space selects.
 */
export function Calendar(props: CalendarProps) {
  const today = toISODate(new Date());
  // The day that holds keyboard focus (roving tabindex), and the visible month.
  const [focused, setFocused] = createSignal(props.value ?? today);
  const [month, setMonth] = createSignal(focused());
  const days = createMemo(() => monthGrid(month()));
  const weekdays = weekdayLabels("narrow");
  const weekdayNames = weekdayLabels("long");

  let grid!: HTMLDivElement;

  const inVisibleMonth = (iso: string) => iso.slice(0, 7) === month().slice(0, 7);
  const isDisabled = (iso: string) =>
    (props.min !== undefined && iso < props.min) || (props.max !== undefined && iso > props.max);

  function focusDay(iso: string) {
    setFocused(iso);
    if (!inVisibleMonth(iso)) setMonth(iso);
    // Wait for the grid to re-render if the month changed.
    queueMicrotask(() => grid.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus());
  }

  function showMonth(offset: number) {
    const next = addMonths(month(), offset);
    setMonth(next);
    setFocused(next);
  }

  function onKeyDown(event: KeyboardEvent) {
    const current = focused();
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(current, -1),
      ArrowRight: () => addDays(current, 1),
      ArrowUp: () => addDays(current, -7),
      ArrowDown: () => addDays(current, 7),
      PageUp: () => addMonths(current, -1),
      PageDown: () => addMonths(current, 1),
      Home: () => addDays(current, -weekdayIndex(current)),
      End: () => addDays(current, 6 - weekdayIndex(current)),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      focusDay(move());
    }
  }

  onMount(() => focusDay(focused()));

  return (
    <div class="flex w-[20rem] flex-col gap-1">
      <div class="flex h-12 items-center justify-between pr-1 pl-3">
        <span class="text-title-small text-on-surface-variant" aria-live="polite">
          {formatMonth(month())}
        </span>
        <div class="flex">
          <IconButton icon="chevron-left" label="Previous month" onClick={() => showMonth(-1)} />
          <IconButton icon="chevron-right" label="Next month" onClick={() => showMonth(1)} />
        </div>
      </div>

      <div ref={grid} role="grid" aria-label={formatMonth(month())} onKeyDown={onKeyDown} class="flex flex-col px-1">
        <div role="row" class="grid grid-cols-7">
          <For each={weekdays}>
            {(label, i) => (
              <span
                role="columnheader"
                aria-label={weekdayNames[i()]}
                class="flex h-10 items-center justify-center text-body-large text-on-surface"
              >
                {label}
              </span>
            )}
          </For>
        </div>
        <For each={[0, 1, 2, 3, 4, 5]}>
          {(week) => (
            <div role="row" class="grid grid-cols-7">
              <For each={days().slice(week * 7, week * 7 + 7)}>
                {(iso) => {
                  const selected = () => iso === props.value;
                  const isToday = iso === today;
                  return (
                    <div role="gridcell" aria-selected={selected()} class="flex h-12 items-center justify-center">
                      <button
                        type="button"
                        data-date={iso}
                        tabIndex={iso === focused() ? 0 : -1}
                        aria-label={formatLongDate(iso)}
                        aria-current={isToday ? "date" : undefined}
                        disabled={isDisabled(iso)}
                        onClick={() => props.onSelect(iso)}
                        onFocus={() => setFocused(iso)}
                        class={cn(
                          "state-layer focus-ring flex size-10 cursor-pointer items-center justify-center rounded-full text-body-large tabular-nums",
                          "transition-[background-color,color] motion-fast-effects",
                          "disabled:cursor-default disabled:opacity-38",
                          // Neighboring-month days: dimmer color, never opacity (opacity broke
                          // WCAG contrast; on-surface-variant keeps ≥ 4.5:1, see scheme.test.ts).
                          !inVisibleMonth(iso) && "text-on-surface-variant",
                          selected()
                            ? "bg-primary text-on-primary"
                            : isToday
                              ? "border border-primary text-primary"
                              : inVisibleMonth(iso) && "text-on-surface",
                        )}
                      >
                        {Number(iso.slice(8))}
                      </button>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
