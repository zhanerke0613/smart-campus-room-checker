import { Clock, Users, Ban } from "lucide-react";
import type { Room } from "../types";
import { formatRange, formatDuration } from "../lib/time";

interface Props {
  room: Room | null;
}

export function RoomSchedule({ room }: Props) {
  if (!room) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
        Select a room to view its schedule.
      </div>
    );
  }

  const sorted = [...room.bookings].sort((a, b) => a.start - b.start);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{room.name}</h3>
          <p className="text-xs text-slate-500">{room.building}</p>
          {room.equipment.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {room.equipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {item.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {room.capacity}
          </span>
        </div>
      </div>

      {room.blocked ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-700">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Room is blocked{room.blockReason ? ` — ${room.blockReason}` : ""}.
          </span>
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-3 text-sm text-slate-400">No bookings today.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((b, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {b.title}
                </p>
                <p className="text-xs text-slate-500">by {b.bookedBy}</p>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap text-right text-xs text-slate-600 sm:gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{formatRange(b.start, b.end)}</span>
                <span className="hidden xs:inline text-slate-400">·</span>
                <span className="hidden xs:inline">{formatDuration(b.end - b.start)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
