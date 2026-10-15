// Geometry for M3 Expressive "shape library" shapes, as SVG path data in a
// 0–1 box (use with `clipPathUnits="objectBoundingBox"` or scale with viewBox).
//
// Shared by components/ui/shape.tsx, the app logo, and the icon generator
// (scripts/generate-icon.mjs), so it must stay free of path aliases and
// non-erasable TypeScript: Node runs it with type stripping.

/**
 * A "cookie": a circle with `lobes` soft scallops. `depth` is how far the
 * scallops dip, as a fraction of the size.
 */
export function cookiePath(lobes: number, depth = 0.08, steps = 360): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const radius = 0.5 - depth + depth * Math.cos(lobes * angle);
    const x = 0.5 + radius * Math.cos(angle - Math.PI / 2);
    const y = 0.5 + radius * Math.sin(angle - Math.PI / 2);
    points.push(`${x.toFixed(4)} ${y.toFixed(4)}`);
  }
  return `M${points.join(" L")}Z`;
}

/** A rounded card in the 0–1 logo box. `rotate` is in degrees, about the card's center. */
export interface LogoCard {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  rotate: number;
}

/**
 * The Doable mark: two stacked cards (a pile of things to do) with a check on
 * the front one. Large corner radii, per M3 Expressive.
 */
export const LOGO = {
  backCard: { x: 0.24, y: 0.12, width: 0.56, height: 0.6, radius: 0.15, rotate: -12 } satisfies LogoCard,
  frontCard: { x: 0.2, y: 0.26, width: 0.62, height: 0.62, radius: 0.17, rotate: 0 } satisfies LogoCard,
  check: "M0.37 0.58 L0.47 0.68 L0.66 0.48",
  checkWidth: 0.075,
};

/** SVG `transform` for a card's rotation about its own center. */
export function cardTransform(card: LogoCard): string {
  const cx = card.x + card.width / 2;
  const cy = card.y + card.height / 2;
  return `rotate(${card.rotate} ${cx} ${cy})`;
}
