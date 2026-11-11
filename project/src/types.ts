export interface Booking {
  start: number; // minutes from midnight
  end: number;
  title: string;
  bookedBy: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  blockReason?: string;
  bookings: Booking[];
}

export type Severity = "error" | "warning";

export interface CheckReason {
  code: string;
  message: string;
  severity: Severity;
}

export interface AvailabilityResult {
  available: boolean;
  reasons: CheckReason[];
  overlappingBookings: Booking[];
}
