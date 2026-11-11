import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { AvailabilityResult } from "../types";
import { formatRange } from "../lib/time";

interface Props {
  result: AvailabilityResult;
  candidateRange: { start: number; end: number } | null;
}

export function DecisionCard({ result, candidateRange }: Props) {
  if (!candidateRange) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-400">
        Pick a room and a start/end time to check availability.
      </div>
    );
  }

  const { available, reasons, overlappingBookings } = result;
  const rangeLabel = formatRange(candidateRange.start, candidateRange.end);

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        available
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {available ? (
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        ) : (
          <XCircle className="h-7 w-7 text-red-600" />
        )}
        <div>
          <p
            className={`text-lg font-semibold ${
              available ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {available ? "Available" : "Unavailable"}
          </p>
          <p className="text-xs text-slate-600">
            Requested slot: {rangeLabel}
          </p>
        </div>
      </div>

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-2">
          {reasons.map((r) => (
            <li
              key={r.code}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{r.message}</span>
            </li>
          ))}
        </ul>
      )}

      {!available && overlappingBookings.length > 0 && (
        <div className="mt-4 border-t border-red-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
            Conflicting bookings
          </p>
          <ul className="space-y-1.5">
            {overlappingBookings.map((b, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-700"
              >
                <span className="truncate font-medium">{b.title}</span>
                <span className="whitespace-nowrap text-slate-500">
                  {formatRange(b.start, b.end)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
