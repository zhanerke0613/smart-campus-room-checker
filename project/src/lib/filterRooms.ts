import type { Room } from "../types";

export interface RoomFilter {
  minCapacity: number;
  equipment: string[];
}

export function filterRooms(rooms: Room[], filter: RoomFilter): Room[] {
  return rooms.filter((room) => {
    if (room.capacity < filter.minCapacity) return false;
    if (filter.equipment.length > 0) {
      const hasAll = filter.equipment.every((item) =>
        room.equipment.includes(item)
      );
      if (!hasAll) return false;
    }
    return true;
  });
}
