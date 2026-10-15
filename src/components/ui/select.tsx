import * as SelectPrimitive from "@kobalte/core/select";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { FieldOutline } from "./text-field";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  class?: string;
}

/**
 * M3 "exposed dropdown menu": an outlined text field that opens a menu.
 * The label is always floated because a value is always selected.
 */
export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  return (
    <SelectPrimitive.Root<SelectOption<T>>
      class={props.class}
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      value={props.options.find((o) => o.value === props.value)}
      onChange={(option) => option && props.onChange(option.value)}
      disallowEmptySelection
      gutter={4}
      sameWidth
      itemComponent={(itemProps) => (
        <SelectPrimitive.Item
          item={itemProps.item}
          class={cn(
            "state-layer flex h-12 cursor-pointer items-center gap-3 rounded-md px-3 text-label-large text-on-surface outline-none",
            "data-[selected]:bg-tertiary-container data-[selected]:text-on-tertiary-container",
          )}
        >
          <SelectPrimitive.ItemLabel class="flex-1">{itemProps.item.rawValue.label}</SelectPrimitive.ItemLabel>
          <SelectPrimitive.ItemIndicator class="flex">
            <Icon name="check" size={24} />
          </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
      )}
    >
      <div class="group/field relative">
        <SelectPrimitive.Trigger
          aria-label={props.label}
          class="flex h-14 w-full cursor-pointer items-center justify-between gap-2 rounded-xs bg-transparent pr-3 pl-4 text-left text-body-large text-on-surface outline-none"
        >
          <SelectPrimitive.Value<SelectOption<T>>>{(state) => state.selectedOption()?.label}</SelectPrimitive.Value>
          <SelectPrimitive.Icon class="flex text-on-surface-variant transition-transform motion-fast-spatial data-[expanded]:rotate-180">
            <Icon name="chevron-down" size={24} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <FieldOutline label={props.label} floated />
      </div>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          class={cn(
            "z-50 rounded-lg bg-surface-container-low p-1 shadow-2",
            "origin-(--kb-select-content-transform-origin) motion-fast-spatial",
            "data-[expanded]:animate-in data-[expanded]:fade-in data-[expanded]:zoom-in-95",
            "data-[closed]:animate-out data-[closed]:fade-out",
          )}
        >
          <SelectPrimitive.Listbox class="flex max-h-80 flex-col gap-0.5 overflow-y-auto outline-none" />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
