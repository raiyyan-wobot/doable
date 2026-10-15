import * as PopoverPrimitive from "@kobalte/core/popover";
import { createSignal, type JSX } from "solid-js";
import { formatLongDate, parseISODate, toISODate } from "~/lib/dates";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { ChipContent, chipVariants } from "./chip";
import { Icon } from "./icon";
import { FieldOutline } from "./text-field";

interface DatePopoverProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  min?: string;
  max?: string;
  /** Accessible name of the trigger button. */
  triggerLabel: string;
  triggerClass: string;
  triggerContent: JSX.Element;
}

/**
 * M3 docked date picker: a calendar in a popover anchored to its trigger.
 * Picking a day applies it and closes; "Clear" and "Today" sit underneath.
 * Container: surface-container-high, large (16dp) corners, elevation 3.
 */
function DatePopover(props: DatePopoverProps) {
  const [open, setOpen] = createSignal(false);
  const choose = (iso: string | null) => {
    props.onChange(iso);
    setOpen(false);
  };
  const today = () => toISODate(new Date());
  const todayAllowed = () =>
    (props.min === undefined || today() >= props.min) && (props.max === undefined || today() <= props.max);

  return (
    // fitViewport + overflowPadding: in small windows the picker stays fully on
    // screen (flipping above the field if needed) and scrolls instead of cropping.
    <PopoverPrimitive.Root
      open={open()}
      onOpenChange={setOpen}
      gutter={4}
      placement="bottom-start"
      fitViewport
      overflowPadding={8}
    >
      <PopoverPrimitive.Trigger aria-label={props.triggerLabel} class={props.triggerClass}>
        {props.triggerContent}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label="Choose date"
          // The calendar focuses the selected (or today's) date itself, per the
          // WAI-ARIA date picker pattern; Kobalte's default would move focus to
          // the first button ("Previous month") instead.
          onOpenAutoFocus={(event) => event.preventDefault()}
          class={cn(
            "z-50 overflow-y-auto rounded-lg bg-surface-container-high p-2 shadow-3 outline-none",
            "origin-(--kb-popover-content-transform-origin) popup-motion",
          )}
        >
          <Calendar value={props.value} min={props.min} max={props.max} onSelect={choose} />
          <div class="flex justify-end gap-1 px-1 pt-1">
            <Button variant="text" size="xs" disabled={!props.value} onClick={() => choose(null)}>
              Clear
            </Button>
            <Button variant="text" size="xs" disabled={!todayAllowed()} onClick={() => choose(today())}>
              Today
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  min?: string;
  max?: string;
  class?: string;
}

/** Outlined text field look (M3 docked picker input) that opens the calendar. */
export function DateField(props: DateFieldProps) {
  return (
    <div class={cn("group/field relative", props.class)}>
      <DatePopover
        value={props.value}
        onChange={props.onChange}
        min={props.min}
        max={props.max}
        triggerLabel={`${props.label}: ${props.value ? formatLongDate(props.value) : "not set"}`}
        triggerClass="flex h-14 w-full cursor-pointer items-center justify-between gap-2 rounded-xs bg-transparent pr-3 pl-4 text-left text-body-large text-on-surface outline-none"
        triggerContent={
          <>
            <span class="truncate">{props.value ? formatLongDate(props.value) : ""}</span>
            <Icon name="calendar" size={24} class="text-on-surface-variant" />
          </>
        }
      />
      <FieldOutline label={props.label} floated={props.value !== null} />
    </div>
  );
}

interface DateChipProps {
  /** Shown before the date, e.g. "From". */
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  min?: string;
  max?: string;
}

/** A filter chip that opens the calendar: "From: 15 Oct". */
export function DateChip(props: DateChipProps) {
  const text = () =>
    props.value
      ? `${props.label}: ${parseISODate(props.value).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : props.label;
  return (
    <DatePopover
      value={props.value}
      onChange={props.onChange}
      min={props.min}
      max={props.max}
      triggerLabel={`${props.label}: ${props.value ? formatLongDate(props.value) : "any"}`}
      triggerClass={chipVariants({ selected: props.value !== null, leading: true, trailing: true })}
      triggerContent={
        <ChipContent icon="calendar" label={text()} selected={props.value !== null} trailingIcon="chevron-down" />
      }
    />
  );
}
