import { For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { ChipContent, chipVariants, InputChip } from "~/components/ui/chip";
import { DateChip } from "~/components/ui/date-picker";
import { IconButton } from "~/components/ui/icon-button";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "~/components/ui/menu";
import type { SelectOption } from "~/components/ui/select";
import type { DueRange } from "../api/types";
import { DUE_OPTIONS, PRIORITY_FILTER_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from "../config/options";
import { useTasks } from "../state/context";
import type { IconName } from "~/components/ui/icons";

interface ChipMenuProps<T extends string> {
  /** Accessible name of the menu trigger, e.g. "Status". */
  name: string;
  icon: IconName;
  options: SelectOption<T>[];
  value: T;
  /** Whether the chip shows as selected (a non-default filter is applied). */
  selected: boolean;
  onChange: (value: T) => void;
}

/** A filter chip that opens a single-choice menu: the M3 pattern for filters with options. */
function ChipMenu<T extends string>(props: ChipMenuProps<T>) {
  const label = () => props.options.find((o) => o.value === props.value)?.label ?? props.name;
  return (
    <Menu>
      <MenuTrigger
        aria-label={`${props.name}: ${label()}`}
        class={chipVariants({ selected: props.selected, leading: true, trailing: true })}
      >
        <ChipContent icon={props.icon} label={label()} selected={props.selected} trailingIcon="chevron-down" />
      </MenuTrigger>
      <MenuContent>
        <MenuRadioGroup value={props.value} onChange={(v) => props.onChange(v as T)}>
          <For each={props.options}>{(o) => <MenuRadioItem value={o.value}>{o.label}</MenuRadioItem>}</For>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export function FilterBar() {
  const { filters } = useTasks();
  const range = () => (filters.values.due.kind === "range" ? (filters.values.due as DueRange) : null);

  return (
    <div class="flex shrink-0 flex-wrap items-start gap-2 px-4 py-4 @2xl/pane:flex-nowrap @2xl/pane:gap-4 @2xl/pane:px-8" role="toolbar" aria-label="Filters">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <ChipMenu
        name="Status"
        icon="list-filter"
        options={STATUS_OPTIONS}
        value={filters.values.status}
        selected={filters.values.status !== "all"}
        onChange={(status) => filters.set("status", status)}
      />
      <ChipMenu
        name="Due date"
        icon="calendar"
        options={DUE_OPTIONS}
        value={filters.values.due.kind}
        selected={filters.values.due.kind !== "any"}
        onChange={filters.setDueKind}
      />
      <Show when={range()}>
        {(r) => (
          <>
            <DateChip
              label="From"
              value={r().from}
              max={r().to ?? undefined}
              onChange={(iso) => filters.setRange("from", iso ?? "")}
            />
            <DateChip
              label="To"
              value={r().to}
              min={r().from ?? undefined}
              onChange={(iso) => filters.setRange("to", iso ?? "")}
            />
          </>
        )}
      </Show>
      <ChipMenu
        name="Priority"
        icon="flag"
        options={PRIORITY_FILTER_OPTIONS}
        value={filters.values.priority ?? "any"}
        selected={filters.values.priority !== null}
        onChange={(p) => filters.set("priority", p === "any" ? null : p)}
      />
      <Show when={filters.values.tag}>
        {(tag) => (
          <InputChip
            icon="tag"
            label={tag()}
            removeLabel={`Remove tag filter ${tag()}`}
            onRemove={() => filters.set("tag", null)}
          />
        )}
      </Show>
      <Show when={filters.hasRefinements()}>
        <Button variant="text" size="xs" onClick={filters.clearRefinements}>
          Reset
        </Button>
      </Show>

      </div>

      <div class="flex shrink-0 items-center gap-1">
        <ChipMenu
          name="Sort by"
          icon="arrow-down-up"
          options={SORT_OPTIONS}
          value={filters.values.sortBy}
          selected={false}
          onChange={(sortBy) => filters.set("sortBy", sortBy)}
        />
        <IconButton
          size="xs"
          icon={filters.values.sortDir === "asc" ? "arrow-up" : "arrow-down"}
          label={filters.values.sortDir === "asc" ? "Ascending" : "Descending"}
          onClick={() => filters.set("sortDir", (dir) => (dir === "asc" ? "desc" : "asc"))}
        />
      </div>
    </div>
  );
}
