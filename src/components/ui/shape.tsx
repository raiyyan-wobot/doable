import { createUniqueId, type JSX } from "solid-js";
import { cookiePath } from "~/lib/shapes";
import { cn } from "~/lib/utils";

/**
 * M3 Expressive shape library: decorative containers in organic shapes
 * (cookie, clover, burst…). Geometry lives in lib/shapes.ts.
 */
const COOKIE_9 = cookiePath(9);

interface ShapeProps {
  children: JSX.Element;
  /** Size and content color. */
  class?: string;
  /** Fill of the shape, e.g. "bg-tertiary-container". */
  shapeClass: string;
}

/** A 9-lobed "cookie" container. */
export function CookieShape(props: ShapeProps) {
  const clipId = `cookie-${createUniqueId()}`;
  return (
    <div class={cn("relative flex items-center justify-center", props.class)}>
      <svg class="absolute size-0" aria-hidden="true">
        <clipPath id={clipId} clipPathUnits="objectBoundingBox">
          <path d={COOKIE_9} />
        </clipPath>
      </svg>
      <div class={cn("absolute inset-0", props.shapeClass)} style={{ "clip-path": `url(#${clipId})` }} />
      <div class="relative">{props.children}</div>
    </div>
  );
}
