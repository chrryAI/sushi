/**
 * Spatial Coordinate System
 * Patent-pending navigation for SUSHI CLI
 */

export interface SpatialCoordinate {
  /** X-Axis: App/Agent ID (vex, vault, sensei, student) */
  x: string;
  /** Y-Axis: Context/Workspace (auth, payment, ui) */
  y: string;
  /** Z-Axis: Time/Version (timestamp or sequence number) */
  z: number;
}

export interface SpatialContext {
  current: SpatialCoordinate;
  history: SpatialCoordinate[];
  bookmarks: Record<string, SpatialCoordinate>;
}

export interface SpatialNavigationEvent {
  from: SpatialCoordinate;
  to: SpatialCoordinate;
  reason: "user" | "agent" | "auto";
  timestamp: number;
}

// Parse spatial commands like "@x:sensei y:auth z:-1"
export function parseSpatialCommand(input: string): {
  text: string;
  coordinate: Partial<SpatialCoordinate>;
} {
  const coordinate: Partial<SpatialCoordinate> = {};

  // Extract @x:value
  const xMatch = input.match(/@x:(\w+)/);
  if (xMatch) coordinate.x = xMatch[1];

  // Extract y:value
  const yMatch = input.match(/\by:(\w+)/);
  if (yMatch) coordinate.y = yMatch[1];

  // Extract z:value (can be negative for history)
  const zMatch = input.match(/\bz:(-?\d+)/);
  if (zMatch) coordinate.z = parseInt(zMatch[1], 10);

  // Remove spatial commands from text
  const text = input
    .replace(/@x:\w+/g, "")
    .replace(/\by:\w+/g, "")
    .replace(/\bz:-?\d+/g, "")
    .trim();

  return { text, coordinate };
}

// Format coordinate for display
export function formatCoordinate(coord: SpatialCoordinate): string {
  return `x:${coord.x} y:${coord.y} z:${coord.z}`;
}

// Default coordinates
export const DEFAULT_COORDINATE: SpatialCoordinate = {
  x: "sensei",
  y: "general",
  z: Date.now(),
};
