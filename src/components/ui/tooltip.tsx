/**
 * M3 plain tooltip (Compose PlainTooltipTokens): inverse surface, extra-small
 * (4dp) corners, body-small text. Used by IconButton; exported for any other
 * Kobalte Tooltip.Content.
 */
export const tooltipClass = [
  "z-50 flex min-h-6 items-center rounded-xs bg-inverse-surface px-2 py-1",
  "text-body-small text-inverse-on-surface",
  "origin-(--kb-tooltip-content-transform-origin) popup-motion",
].join(" ");
