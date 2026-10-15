import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/utils";
import { ICONS, type IconName } from "./icons";

interface IconProps {
  name: IconName;
  /**
   * Active/selected style. M3 swaps to a filled glyph here; Lucide is
   * outline-only, so we tint the shape (20% fill) and thicken the stroke.
   */
  filled?: boolean;
  /** Heavier stroke, for small glyphs that need more presence (e.g. a checkbox tick). */
  bold?: boolean;
  /** Pixel size. */
  size?: number;
  class?: string;
}

/**
 * Lucide icon. Decorative: the surrounding control carries the accessible label.
 * The `icon` class is a hook for parents that recolor icons (e.g. menus).
 */
export function Icon(props: IconProps) {
  const strokeWidth = () => (props.bold ? 3 : props.filled ? 2.25 : 2);

  return (
    <Dynamic
      component={ICONS[props.name]}
      size={props.size ?? 24}
      stroke-width={strokeWidth()}
      fill={props.filled ? "currentColor" : "none"}
      fill-opacity={props.filled ? 0.2 : undefined}
      aria-hidden="true"
      class={cn("icon shrink-0 transition-[fill-opacity,stroke-width] motion-fast-effects", props.class)}
    />
  );
}
