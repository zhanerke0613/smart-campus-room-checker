import { useMemo, useState } from "react";
import {
  Clock,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { rooms } from "./data";
import type { Room } from "./types";
import { checkAvailability } from "./lib/availability";
import { filterRooms } from "./lib/filterRooms";
import { resolveVisibleRoom, parseRequiredCurrentTime } from "./lib/selection";
import {
  minutesToHHMM,
  minutesToHHMMEnd,
  hhmmToMinutes,
  hhmmToMinutesEnd,
  formatDuration,
  nowInMinutes,
} from "./lib/time";
import { RoomSchedule } from "./components/RoomSchedule";
import { DecisionCard } from "./components/DecisionCard";
import { RoomPicker } from "./components/RoomPicker";

const DEFAULT_NOW = 13 * 60; // 13:00 as a stable default
const MAX_BOOKING = 120;

function App() {
  const [nowOverride, setNowOverride] = useState<string>(
    minutesToHHMM(DEFAULT_NOW)
  );
  const nowMin = parseRequiredCurrentTime(nowOverride, hhmmToMinutes);

  const [roomId, setRoomId] = useState<string>(rooms[0].id);
  const [startStr, setStartStr] = useState<string>("14:00");
  const [endStr, setEndStr] = useState<string>("15:00");
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);

  const startMin = hhmmToMinutes(startStr);
  const endMin = hhmmToMinutesEnd(endStr);

  const hasActiveFilters = minCapacity > 0 || equipmentFilter.length > 0;

  const filteredRooms = useMemo(
    () => filterRooms(rooms, { minCapacity, equipment: equipmentFilter }),
    [minCapacity, equipmentFilter]
  );

  const selectedRoom: Room | null = resolveVisibleRoom(filteredRooms, roomId);

  function handleSelectRoom(id: string) {
    setRoomId(id);
  }

  function toggleEquipment(item: string) {
    setEquipmentFilter((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  function clearFilters() {
    setMinCapacity(0);
    setEquipmentFilter([]);
  }

  const candidate =
    startMin !== null && endMin !== null
      ? { start: startMin, end: endMin }
      : null;

  const result = useMemo(() => {
    if (!candidate || nowMin === null || !selectedRoom) return null;
    return checkAvailability(selectedRoom, candidate.start, candidate.end, nowMin);
  }, [selectedRoom, candidate, nowMin]);

  const duration = candidate ? candidate.end - candidate.start : 0;
  const overLimit = duration > MAX_BOOKING;
  const invalidOrder =
    startMin !== null && endMin !== null && startMin >= endMin;
  const inPast =
    startMin !== null && nowMin !== null && startMin <= nowMin;

  function resetToLive() {
    setNowOverride(minutesToHHMM(nowInMinutes()));
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Smart Campus Room Availability
            </h1>
            <p className="text-xs text-slate-500">
              Check whether a campus room is free for your time slot.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left: form + decision */}
          <section className="space-y-5">
            {/* Current time */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Current time
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-invalid={nowMin === null}
                    aria-describedby={nowMin === null ? "current-time-error" : undefined}
                    value={nowOverride}
                    onChange={(e) => setNowOverride(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={resetToLive}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3 w-3" /> Now
                  </button>
                </span>
              </label>
              {nowMin === null && (
                <p id="current-time-error" role="alert" className="mt-2 text-xs text-red-600">
                  Enter a valid current time to check availability.
                </p>
              )}
            </div>

            {/* Room selection with filters */}
            <RoomPicker
              rooms={filteredRooms}
              selectedRoomId={roomId}
              onSelectRoom={handleSelectRoom}
              minCapacity={minCapacity}
              onMinCapacityChange={setMinCapacity}
              equipmentFilter={equipmentFilter}
              onEquipmentToggle={toggleEquipment}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {!selectedRoom && (
              <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                The selected room is hidden by your filters. Select a visible room or clear the filters.
              </p>
            )}

            {/* Time inputs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                Requested interval
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Start
                  </span>
                  <input
                    type="time"
                    value={startStr}
                    onChange={(e) => setStartStr(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    End (HH:MM, up to 24:00)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:MM"
                    value={endStr}
                    onChange={(e) => setEndStr(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              {/* Inline validation hints */}
              <div className="mt-3 space-y-1.5 text-xs">
                {nowMin === null ? (
                  <p className="text-red-600">Enter a valid current time first.</p>
                ) : startMin === null || endMin === null ? (
                  <p className="text-slate-400">Enter valid times (HH:MM).</p>
                ) : invalidOrder ? (
                  <p className="text-red-600">
                    End time must be after start time.
                  </p>
                ) : inPast ? (
                  <p className="text-red-600">
                    Start must be after the current time ({minutesToHHMM(nowMin)}).
                  </p>
                ) : overLimit ? (
                  <p className="text-red-600">
                    Duration is {formatDuration(duration)} — max allowed is 120 min.
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Duration: {formatDuration(duration)} · window{" "}
                    {minutesToHHMM(startMin)}–{minutesToHHMMEnd(endMin)}
                  </p>
                )}
              </div>
            </div>

            {/* Decision */}
            {result && candidate && (
              <DecisionCard result={result} candidateRange={candidate} />
            )}
          </section>

          {/* Right: schedule */}
          <section className="space-y-5">
            <RoomSchedule room={selectedRoom} />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500 shadow-sm">
              <p className="mb-1 font-semibold text-slate-700">Rules applied</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Start ≥ 0, End ≤ 1440 (00:00–24:00), Start &lt; End.</li>
                <li>Start must be after the current time.</li>
                <li>Booking length ≤ 120 minutes.</li>
                <li>Room must not be blocked.</li>
                <li>No overlap with existing bookings; touching endpoints allowed.</li>
                <li>Checking never modifies existing bookings.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
