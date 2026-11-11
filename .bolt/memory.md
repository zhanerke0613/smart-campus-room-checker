# Project memory

## Product intent & audience

- Smart Campus Room Availability Checker: UI for checking campus room availability and viewing room schedules.
- Imported practice/training project (Practice Work #10, Task #08); primary goal is correctness and regression safety, not feature expansion.

## Brand personality & voice

- Technical, precise, verification-focused; emphasis on evidence, test counts, and preserving acceptance criteria.

## Visual design & UX direction

- Key UI components: `App.tsx`, `DecisionCard` (availability verdict), `RoomSchedule` (room schedule), filters (capacity/equipment), Current Time input.
- UX patterns: amber notice when selected room is hidden by filters; error state on Current Time field when empty/invalid; suppress verdict and schedule when no valid room/time is selected.
- No visual redesign implied; fixes are behavioral.

## Decisions, constraints & rationale

- No database, backend, authentication, or new dependencies.
- Must preserve AC1–AC6 and all existing tests.
- R1 fix (filter-hidden room in verdict/schedule): `resolveVisibleRoom(filteredRooms, roomId)` returns `null` if room not in filtered list; when `selectedRoom` is `null`, `checkAvailability` is skipped, verdict and schedule are suppressed.
- R2 fix (clearing Current Time falls back to 13:00): `parseRequiredCurrentTime(nowOverride, hhmmToMinutes)` returns `null` for empty input; no availability check runs, error state shown.
- Test suite: 56 checks total (35 + 17 + 4), all passing; `npm run typecheck` passes.
- Both R1 and R2 already have fixes and unit-level regression tests in code, despite AGENTS.md still describing them as open.
- User requires approval before any file modifications.

## Open questions & assumptions

- AGENTS.md needs updating: mark R1/R2 as resolved; update test-count line (52 → 56).
- R1 regression test is unit-level only (`resolveVisibleRoom`); an optional stronger App-level test (verdict suppressed when room filtered out) was proposed but not yet approved.
- No `.bolt/prompt` file exists; all current instructions are per-request.
- Awaiting user approval on whether to apply AGENTS.md update and/or stronger R1 test, or leave current state as sufficient.