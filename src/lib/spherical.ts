export function sphericalToCartesian(
  yaw: number,
  pitch: number,
  radius = 9,
): [number, number, number] {
  const x = radius * Math.cos(pitch) * Math.sin(yaw);
  const y = radius * Math.sin(pitch);
  const z = radius * Math.cos(pitch) * Math.cos(yaw);
  return [x, y, z];
}

export const HOTSPOT_FLOOR_Y = -2.5;
export const HOTSPOT_MIN_DIST = 1.5;
export const HOTSPOT_MAX_DIST = 9;

export function projectToFloor(
  dx: number,
  dy: number,
  dz: number,
  floorY = HOTSPOT_FLOOR_Y,
): { yaw: number; pitch: number; distance: number } {
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.asin(Math.max(-1, Math.min(1, dy)));
  let distance: number;
  if (dy < -0.02) {
    const t = floorY / dy;
    const fx = t * dx;
    const fz = t * dz;
    distance = Math.sqrt(fx * fx + fz * fz);
  } else {
    distance = HOTSPOT_MAX_DIST;
  }
  distance = Math.max(HOTSPOT_MIN_DIST, Math.min(HOTSPOT_MAX_DIST, distance));
  return { yaw, pitch, distance };
}
