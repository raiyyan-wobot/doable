import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our M3 theme. Without this it can't tell the type-scale
// class `text-title-large` (font size) from the color class `text-on-surface`
// and would drop one of them when both are present.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-large", "display-medium", "display-small",
        "headline-large", "headline-medium", "headline-small",
        "title-large", "title-medium", "title-small",
        "body-large", "body-medium", "body-small",
        "label-large", "label-medium", "label-small",
      ],
      radius: ["xs", "sm", "md", "lg", "lg-plus", "xl", "xl-plus", "2xl"],
      shadow: ["1", "2", "3", "4", "5"],
    },
  },
});

/** Merge Tailwind classes; later classes win over conflicting earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
