import { createUniqueId, Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * M3 outlined text field (Compose OutlinedTextFieldTokens): 56dp tall,
 * extra-small (4dp) corners, 1dp `outline` border → 2dp `primary` on focus,
 * body-large input. The label rests inside the field and floats into a notch
 * in the border (body-small) when focused or filled.
 *
 * The notch is the <fieldset>/<legend> technique: the legend holds an
 * invisible copy of the label, so the border is cut exactly where the
 * floating label sits.
 */

/** Shared outline + floating label. `floated`: always float (dates, selects). */
export function FieldOutline(props: { label: string; for?: string; floated?: boolean; multiline?: boolean }) {
  const floatedLabel = "top-0 -translate-y-1/2 px-1 text-body-small left-3";
  return (
    <>
      <fieldset
        aria-hidden="true"
        class={cn(
          "pointer-events-none absolute inset-0 -top-[5px] m-0 rounded-xs border border-outline px-3 text-left",
          "transition-[border-color] motion-fast-effects",
          "group-hover/field:border-on-surface",
          "group-focus-within/field:border-2 group-focus-within/field:border-primary",
        )}
      >
        <legend
          class={cn(
            "invisible block h-[11px] w-auto p-0 text-body-small whitespace-nowrap",
            props.floated
              ? "max-w-full"
              : "max-w-0 transition-[max-width] group-focus-within/field:max-w-full group-has-[:is(input,textarea):not(:placeholder-shown)]/field:max-w-full",
          )}
        >
          <span class="px-1">{props.label}</span>
        </legend>
      </fieldset>
      <label
        for={props.for}
        class={cn(
          "pointer-events-none absolute origin-left text-on-surface-variant",
          "label-motion",
          "group-focus-within/field:text-primary",
          props.floated
            ? floatedLabel
            : cn(
                "left-4 text-body-large",
                props.multiline ? "top-4" : "top-1/2 -translate-y-1/2",
                "group-focus-within/field:top-0 group-focus-within/field:left-3 group-focus-within/field:-translate-y-1/2 group-focus-within/field:px-1 group-focus-within/field:text-body-small",
                "group-has-[:is(input,textarea):not(:placeholder-shown)]/field:top-0 group-has-[:is(input,textarea):not(:placeholder-shown)]/field:left-3 group-has-[:is(input,textarea):not(:placeholder-shown)]/field:-translate-y-1/2 group-has-[:is(input,textarea):not(:placeholder-shown)]/field:px-1 group-has-[:is(input,textarea):not(:placeholder-shown)]/field:text-body-small",
              ),
        )}
      >
        {props.label}
      </label>
    </>
  );
}

/** Supporting text under a field: body-small, 16dp inset. */
export function SupportingText(props: { id: string; children: JSX.Element }) {
  return (
    <p id={props.id} class="px-4 pt-1 text-body-small text-on-surface-variant">
      {props.children}
    </p>
  );
}

const inputClass =
  "w-full bg-transparent px-4 text-body-large text-on-surface outline-none placeholder:text-transparent";

type TextFieldProps = {
  label: string;
  supportingText?: string;
  class?: string;
} & (
  | ({ multiline?: false } & JSX.InputHTMLAttributes<HTMLInputElement>)
  | ({ multiline: true } & JSX.TextareaHTMLAttributes<HTMLTextAreaElement>)
);

export function TextField(props: TextFieldProps) {
  const [local, rest] = splitProps(props, ["label", "supportingText", "class", "multiline", "id"]);
  const id = local.id ?? createUniqueId();
  const supportId = `${id}-support`;

  return (
    <div class={local.class}>
      <div class="group/field relative">
        <Show
          when={local.multiline}
          fallback={
            <input
              id={id}
              // A blank placeholder makes `:placeholder-shown` mean "empty".
              placeholder=" "
              aria-describedby={local.supportingText ? supportId : undefined}
              class={cn(inputClass, "h-14")}
              {...(rest as JSX.InputHTMLAttributes<HTMLInputElement>)}
            />
          }
        >
          <textarea
            id={id}
            placeholder=" "
            aria-describedby={local.supportingText ? supportId : undefined}
            class={cn(inputClass, "block min-h-28 resize-none py-4")}
            {...(rest as JSX.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        </Show>
        <FieldOutline label={local.label} for={id} multiline={local.multiline} />
      </div>
      <Show when={local.supportingText}>
        <SupportingText id={supportId}>{local.supportingText}</SupportingText>
      </Show>
    </div>
  );
}
