import { checkAvailability } from "../lib/availability";
import { hhmmToMinutes, hhmmToMinutesEnd, minutesToHHMMEnd } from "../lib/time";
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

const emptyRoom: Room = {
  id: "empty",
  name: "Empty",
  building: "Test",
  capacity: 10,
  equipment: [],
  blocked: false,
  bookings: [],
};

const bookedRoom: Room = {
  id: "booked",
  name: "Booked",
  building: "Test",
  capacity: 10,
  equipment: [],
  blocked: false,
  bookings: [{ start: 600, end: 660, title: "B1", bookedBy: "X" }],
};

const blockedRoom: Room = {
  id: "blocked",
  name: "Blocked",
  building: "Test",
  capacity: 10,
  equipment: [],
  blocked: true,
  blockReason: "maintenance",
  bookings: [],
};

console.log("=== Parser validation ===");
check("hhmmToMinutesEnd('24:00') = 1440", hhmmToMinutesEnd("24:00") === 1440);
check("hhmmToMinutesEnd('23:59') = 1439", hhmmToMinutesEnd("23:59") === 1439);
check("hhmmToMinutesEnd('00:00') = 0", hhmmToMinutesEnd("00:00") === 0);
check("hhmmToMinutesEnd('24:01') = null", hhmmToMinutesEnd("24:01") === null);
check("hhmmToMinutesEnd('25:00') = null", hhmmToMinutesEnd("25:00") === null);
check("hhmmToMinutesEnd('12:60') = null", hhmmToMinutesEnd("12:60") === null);
check(
  "hhmmToMinutesEnd('12:30.5') = null (fractional)",
  hhmmToMinutesEnd("12:30.5") === null
);
check(
  "hhmmToMinutesEnd('12:3') = null (incomplete)",
  hhmmToMinutesEnd("12:3") === null
);
check("hhmmToMinutesEnd('abc') = null", hhmmToMinutesEnd("abc") === null);
check("hhmmToMinutesEnd('') = null", hhmmToMinutesEnd("") === null);
check(
  "hhmmToMinutesEnd('24:00 ') = 1440 (trimmed)",
  hhmmToMinutesEnd("24:00 ") === 1440
);
check(
  "hhmmToMinutes('24:00') = null (start rejects 24:00)",
  hhmmToMinutes("24:00") === null
);
check("minutesToHHMMEnd(1440) = '24:00'", minutesToHHMMEnd(1440) === "24:00");
check("minutesToHHMMEnd(1380) = '23:00'", minutesToHHMMEnd(1380) === "23:00");

console.log("\n=== AC1: Interval bounds and start-after-now ===");
check(
  "AC1 valid interval (800,860) now=700 -> available",
  checkAvailability(emptyRoom, 800, 860, 700).available
);
check(
  "AC1 start<0 rejected",
  !checkAvailability(emptyRoom, -10, 60, 700).available
);
check(
  "AC1 end>1440 rejected",
  !checkAvailability(emptyRoom, 1400, 1441, 700).available
);
check(
  "AC1 end=1440 accepted (bounds)",
  checkAvailability(emptyRoom, 1380, 1440, 700).available
);
check(
  "AC1 start>=end rejected",
  !checkAvailability(emptyRoom, 800, 800, 700).available
);
check(
  "AC1 start==end-1 accepted",
  checkAvailability(emptyRoom, 800, 801, 700).available
);
check(
  "AC1 start==now rejected",
  !checkAvailability(emptyRoom, 700, 760, 700).available
);
check(
  "AC1 start>now accepted",
  checkAvailability(emptyRoom, 701, 760, 700).available
);

console.log("\n=== AC2: Exactly 120 allowed, 121 rejected ===");
check(
  "AC2 exactly 120 min accepted",
  checkAvailability(emptyRoom, 800, 920, 700).available
);
check(
  "AC2 121 min rejected",
  !checkAvailability(emptyRoom, 800, 921, 700).available
);

console.log("\n=== AC3: Blocked room always unavailable ===");
check(
  "AC3 blocked room rejected",
  !checkAvailability(blockedRoom, 800, 860, 540).available
);

console.log("\n=== AC4: Overlaps rejected, touching endpoints allowed ===");
check(
  "AC4 touching start=end-of-booking allowed",
  checkAvailability(bookedRoom, 660, 720, 500).available
);
check(
  "AC4 touching end=start-of-booking allowed",
  checkAvailability(bookedRoom, 540, 600, 500).available
);
check(
  "AC4 overlap (start inside booking) rejected",
  !checkAvailability(bookedRoom, 620, 680, 700).available
);
check(
  "AC4 overlap (end inside booking) rejected",
  !checkAvailability(bookedRoom, 580, 610, 500).available
);
check(
  "AC4 fully inside booking rejected",
  !checkAvailability(bookedRoom, 610, 620, 600).available
);

console.log("\n=== AC5: Existing bookings unchanged ===");
const before = JSON.stringify(bookedRoom.bookings);
checkAvailability(bookedRoom, 620, 680, 700);
checkAvailability(bookedRoom, 800, 860, 540);
checkAvailability(bookedRoom, 1380, 1440, 540);
check(
  "AC5 bookings array unchanged after checks",
  JSON.stringify(bookedRoom.bookings) === before
);

console.log("\n=== Required end=1440 test case ===");
check(
  "23:00-24:00 now=540 empty room -> Available",
  checkAvailability(emptyRoom, 1380, 1440, 540).available
);

console.log("\n=== Regression: start earlier than current time ===");
check(
  "start < now (600,660) now=700 -> Unavailable",
  !checkAvailability(emptyRoom, 600, 660, 700).available
);
check(
  "start < now carries PAST reason code",
  checkAvailability(emptyRoom, 600, 660, 700).reasons.some(
    (r) => r.code === "PAST"
  )
);

console.log("\n=== Regression: blocked room bookings unchanged ===");
const blockedBefore = JSON.stringify(blockedRoom.bookings);
checkAvailability(blockedRoom, 800, 860, 540);
check(
  "blockedRoom bookings array unchanged after check",
  JSON.stringify(blockedRoom.bookings) === blockedBefore
);

console.log(`\nResults: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
