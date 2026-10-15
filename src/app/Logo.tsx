import { cardTransform, LOGO, type LogoCard } from "~/lib/shapes";
import { cn } from "~/lib/utils";

function Card(props: { card: LogoCard; class: string }) {
  return (
    <rect
      x={props.card.x}
      y={props.card.y}
      width={props.card.width}
      height={props.card.height}
      rx={props.card.radius}
      transform={cardTransform(props.card)}
      class={props.class}
    />
  );
}

/**
 * The Doable mark: two stacked cards with a check on the front one, drawn in
 * the dynamic color roles so it follows the system accent. The OS app icon is
 * generated from the same geometry (scripts/generate-icon.mjs).
 */
export function LogoMark(props: { class?: string }) {
  return (
    <svg viewBox="0 0 1 1" class={cn("size-9 shrink-0", props.class)} aria-hidden="true">
      <Card card={LOGO.backCard} class="fill-primary-container" />
      <Card card={LOGO.frontCard} class="fill-primary" />
      <path
        d={LOGO.check}
        fill="none"
        class="stroke-on-primary"
        stroke-width={LOGO.checkWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

/** Mark + wordmark, as shown at the top of the navigation rail. */
export function Logo() {
  return (
    <div class="flex items-center gap-3">
      <LogoMark />
      {/* Expressive emphasized type: title-large, heavier and tighter. */}
      <span class="text-title-large font-semibold tracking-tight text-on-surface">Doable</span>
    </div>
  );
}
