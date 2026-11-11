import { filterRooms } from "../lib/filterRooms";
import type { Room } from "../types";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean): void {
  if (cond) {
    pass++;
    console.log(`  PASS: ${name}`);
  } else {
    fail++;
    console.log(`  FAIL: ${name}`);
  }
}

const testRooms: Room[] = [
  {
    id: "a",
    name: "Room A",
    building: "B1",
    capacity: 10,
    equipment: ["projector", "whiteboard"],
    blocked: false,
    bookings: [],
  },
  {
    id: "b",
    name: "Room B",
    building: "B1",
    capacity: 30,
    equipment: ["projector", "audio-system"],
    blocked: true,
    blockReason: "maintenance",
    bookings: [],
  },
  {
    id: "c",
    name: "Room C",
    building: "B2",
    capacity: 50,
    equipment: ["projector", "whiteboard", "audio-system"],
    blocked: false,
    bookings: [],
  },
];

console.log("=== filterRooms: capacity ===");
check(
  "minCapacity=0 returns all rooms",
  filterRooms(testRooms, { minCapacity: 0, equipment: [] }).length === 3
);
check(
  "minCapacity=30 returns rooms B and C",
  filterRooms(testRooms, { minCapacity: 30, equipment: [] }).length === 2
);
check(
  "minCapacity=51 returns no rooms",
  filterRooms(testRooms, { minCapacity: 51, equipment: [] }).length === 0
);
check(
  "minCapacity=10 includes capacity-10 room",
  filterRooms(testRooms, { minCapacity: 10, equipment: [] }).length === 3
);
check(
  "minCapacity=11 excludes capacity-10 room",
  filterRooms(testRooms, { minCapacity: 11, equipment: [] }).length === 2
);

console.log("\n=== filterRooms: equipment ===");
check(
  "equipment=[projector] returns all 3",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["projector"] }).length === 3
);
check(
  "equipment=[whiteboard] returns rooms A and C",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["whiteboard"] }).length === 2
);
check(
  "equipment=[audio-system] returns rooms B and C",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["audio-system"] }).length === 2
);
check(
  "equipment=[projector,whiteboard] returns rooms A and C (ALL match)",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["projector", "whiteboard"] }).length === 2
);
check(
  "equipment=[projector,whiteboard,audio-system] returns only room C",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["projector", "whiteboard", "audio-system"] }).length === 1
);
check(
  "equipment=[nonexistent] returns 0 rooms",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["nonexistent"] }).length === 0
);

console.log("\n=== filterRooms: combined ===");
check(
  "minCapacity=30 + equipment=[whiteboard] returns only room C",
  filterRooms(testRooms, { minCapacity: 30, equipment: ["whiteboard"] }).length === 1
);
check(
  "minCapacity=30 + equipment=[audio-system] returns rooms B and C",
  filterRooms(testRooms, { minCapacity: 30, equipment: ["audio-system"] }).length === 2
);
check(
  "minCapacity=50 + equipment=[projector] returns only room C",
  filterRooms(testRooms, { minCapacity: 50, equipment: ["projector"] }).length === 1
);

console.log("\n=== filterRooms: edge cases ===");
check(
  "empty equipment list returns all rooms",
  filterRooms(testRooms, { minCapacity: 0, equipment: [] }).length === 3
);
check(
  "empty rooms array returns empty",
  filterRooms([], { minCapacity: 0, equipment: [] }).length === 0
);
check(
  "blocked rooms are NOT excluded by filterRooms (availability handles blocking)",
  filterRooms(testRooms, { minCapacity: 0, equipment: ["audio-system"] }).some(
    (r) => r.id === "b"
  )
);

console.log(`\nResults: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
