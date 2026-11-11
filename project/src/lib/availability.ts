import type { AvailabilityResult, Booking, CheckReason, Room } from "../types";

function checkBounds(start: number, end: number): CheckReason | null {
  if (start < 0 || end > 1440) {
    return {
      code: "BOUNDS",
      message: "Times must stay within 00:00–24:00.",
      severity: "error",
    };
  }
  return null;
}

function checkOrder(start: number, end: number): CheckReason | null {
  if (end <= start) {
    return {
      code: "ORDER",
      message: "End time must be later than start time.",
      severity: "error",
    };
  }
  return null;
}

function checkPast(start: number, currentTime: number): CheckReason | null {
  if (start <= currentTime) {
    return {
      code: "PAST",
      message: "Start time must be after the current time.",
      severity: "error",
    };
  }
  return null;
}

function checkDuration(start: number, end: number): CheckReason | null {
  if (end > start && end - start > 120) {
    return {
      code: "TOO_LONG",
      message: "Bookings cannot be longer than 120 minutes.",
      severity: "error",
    };
  }
  return null;
}

function checkBlocked(room: Room | null): CheckReason | null {
  if (room?.blocked) {
    return {
      code: "BLOCKED",
      message: `This room is blocked${room.blockReason ? `: ${room.blockReason}` : ""}.`,
      severity: "error",
    };
  }
  return null;
}

function findOverlaps(room: Room | null, start: number, end: number): Booking[] {
  if (!room || end <= start) return [];
  return room.bookings.filter((b) => !(end <= b.start || start >= b.end));
}

/**
 * Evaluate a candidate booking interval against all acceptance criteria.
 * Does NOT mutate room/booking data (AC5).
 */
export function checkAvailability(
  room: Room | null,
  start: number,
  end: number,
  currentTime: number
): AvailabilityResult {
  const reasons: CheckReason[] = [];

  const bounds = checkBounds(start, end);
  if (bounds) reasons.push(bounds);

  const order = checkOrder(start, end);
  if (order) reasons.push(order);

  const past = checkPast(start, currentTime);
  if (past) reasons.push(past);

  const duration = checkDuration(start, end);
  if (duration) reasons.push(duration);

  const blocked = checkBlocked(room);
  if (blocked) reasons.push(blocked);

  const overlappingBookings = findOverlaps(room, start, end);
  if (overlappingBookings.length > 0) {
    reasons.push({
      code: "OVERLAP",
      message: `Overlaps ${overlappingBookings.length} existing booking${
        overlappingBookings.length > 1 ? "s" : ""
      }.`,
      severity: "error",
    });
  }

  return {
    available: reasons.length === 0,
    reasons,
    overlappingBookings,
  };
}
