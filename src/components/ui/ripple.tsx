import { onCleanup, onMount } from "solid-js";

const PRESSED_OPACITY = 0.1; // StateTokens.PressedStateLayerOpacity
const GROW_MS = 450;
const FADE_MS = 150;

/**
 * M3 press ripple: a circle that grows from the pointer and fades on release.
 * Drop it inside any element with the `state-layer` utility (which makes the
 * element `position: relative`); it listens to its parent's pointer events.
 */
export function Ripple() {
  let host!: HTMLSpanElement;

  onMount(() => {
    const target = host.parentElement;
    if (!target) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || target.matches(":disabled, [data-disabled]")) return;

      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Big enough to cover the farthest corner from the press point.
      const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

      const wave = document.createElement("span");
      Object.assign(wave.style, {
        position: "absolute",
        left: `${x - radius}px`,
        top: `${y - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: "50%",
        backgroundColor: "currentColor",
        opacity: String(PRESSED_OPACITY),
        pointerEvents: "none",
      });
      host.append(wave);

      // `animate` is the Web Animations API; jsdom (tests) doesn't implement it.
      if (typeof wave.animate !== "function") return wave.remove();
      wave.animate([{ transform: "scale(0.2)" }, { transform: "scale(1)" }], {
        duration: GROW_MS,
        easing: "cubic-bezier(0.2, 0, 0, 1)", // M3 "emphasized" easing
        fill: "forwards",
      });

      const release = () => {
        target.removeEventListener("pointerup", release);
        target.removeEventListener("pointerleave", release);
        target.removeEventListener("pointercancel", release);
        wave
          .animate([{ opacity: PRESSED_OPACITY }, { opacity: 0 }], {
            duration: FADE_MS,
            fill: "forwards",
          })
          .finished.then(() => wave.remove());
      };
      target.addEventListener("pointerup", release);
      target.addEventListener("pointerleave", release);
      target.addEventListener("pointercancel", release);
    };

    target.addEventListener("pointerdown", onPointerDown);
    onCleanup(() => target.removeEventListener("pointerdown", onPointerDown));
  });

  return (
    <span
      ref={host}
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
    />
  );
}
