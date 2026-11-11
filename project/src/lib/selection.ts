import type { Room } from "../types";

export function resolveVisibleRoom(visibleRooms: Room[], selectedId: string): Room | null {
  return visibleRooms.find((room) => room.id === selectedId) ?? null;
}

export function parseRequiredCurrentTime(value: string, parse: (value: string) => number | null): number | null {
  return parse(value);
}
