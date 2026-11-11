import { Building2, ChevronRight, Users, Filter, X } from "lucide-react";
import type { Room } from "../types";
import { ALL_EQUIPMENT } from "../data";

interface Props {
  rooms: Room[];
  selectedRoomId: string;
  onSelectRoom: (id: string) => void;
  minCapacity: number;
  onMinCapacityChange: (value: number) => void;
  equipmentFilter: string[];
  onEquipmentToggle: (item: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: "Projector",
  whiteboard: "Whiteboard",
  "audio-system": "Audio System",
  "tv-screen": "TV Screen",
  "video-conferencing": "Video Conferencing",
  "lab-bench": "Lab Bench",
  "studio-lighting": "Studio Lighting",
};

export function RoomPicker({
  rooms,
  selectedRoomId,
  onSelectRoom,
  minCapacity,
  onMinCapacityChange,
  equipmentFilter,
  onEquipmentToggle,
  onClearFilters,
  hasActiveFilters,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Building2 className="h-4 w-4 text-slate-400" />
        Choose a room
      </h2>

      {/* Filters */}
      <div className="mb-4 space-y-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filters
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Capacity filter */}
        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Users className="h-3 w-3" />
            Min. capacity: {minCapacity}
          </span>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={minCapacity}
            onChange={(e) => onMinCapacityChange(Number(e.target.value))}
            className="w-full accent-slate-700"
          />
        </label>

        {/* Equipment filter */}
        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            Equipment
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_EQUIPMENT.map((item) => {
              const active = equipmentFilter.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onEquipmentToggle(item)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {EQUIPMENT_LABELS[item] ?? item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room list or empty message */}
      {rooms.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No matching rooms found. Try adjusting the filters.
        </p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((r) => {
            const active = r.id === selectedRoomId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelectRoom(r.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {r.name}
                    </span>
                    <span
                      className={`block text-xs ${
                        active ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {r.building} · cap {r.capacity}
                      {r.blocked ? " · blocked" : ""}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-300"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
