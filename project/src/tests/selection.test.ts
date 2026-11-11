import { resolveVisibleRoom, parseRequiredCurrentTime } from "../lib/selection";
import { filterRooms } from "../lib/filterRooms";
import { hhmmToMinutes } from "../lib/time";
import { rooms } from "../data";

let passed = 0;
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  PASS: ${name}`);
}
const visible = filterRooms(rooms, { minCapacity: 50, equipment: [] });
check("R1: filtered-out room resolves to null", resolveVisibleRoom(visible, "eng-101") === null);
check("R1: visible room resolves normally", resolveVisibleRoom(visible, visible[0].id)?.id === visible[0].id);
check("R2: cleared current time is invalid", parseRequiredCurrentTime("", hhmmToMinutes) === null);
check("R2: valid current time parses correctly", parseRequiredCurrentTime("13:00", hhmmToMinutes) === 780);
console.log(`Results: ${passed} passed, 0 failed`);
