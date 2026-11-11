# AGENTS.md — Smart Campus Room Availability Checker

Guidelines for AI agents working on this project. Read this before making changes.

## Project overview

A single-page React + TypeScript app that checks whether one campus room at a time is available for a requested time slot. Users can filter a list of 9 fictional rooms by capacity and equipment. All data is fictional and in-memory. No backend, no database, no login, no booking creation.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS for styling
- lucide-react for icons
- Path alias `@/` maps to `src/`
- Tests: plain `tsx` scripts with a `check(name, cond)` helper (no test framework)

## Key files

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Main screen: state, room filters, time inputs, inline hints, layout |
| `src/data.ts` | Fixture: 9 rooms (id, name, building, capacity, equipment, blocked, bookings); exports `ALL_EQUIPMENT` |
| `src/types.ts` | `Room` (includes `equipment`), `Booking`, `CheckReason`, `AvailabilityResult` types |
| `src/lib/availability.ts` | `checkAvailability(room, start, end, currentTime)`: pure; enforces AC1–AC6 |
| `src/lib/time.ts` | Pure time parsing/formatting helpers (`hhmmToMinutes`, `hhmmToMinutesEnd`, `formatRange`, etc.) |
| `src/lib/filterRooms.ts` | `filterRooms(rooms, { minCapacity, equipment })`: pure; equipment uses ALL-match |
| `src/components/RoomPicker.tsx` | Room list, capacity slider, equipment chips, "No matching rooms found" state |
| `src/components/RoomSchedule.tsx` | Selected room's bookings, capacity, and equipment tags |
| `src/components/DecisionCard.tsx` | Renders Available/Unavailable verdict, reasons, and conflicting bookings |
| `src/tests/availability.test.ts` | 35 checks: parser validation, AC1–AC6, regressions |
| `src/tests/filterRooms.test.ts` | 17 checks: capacity, equipment, combined filters, edge cases |
| `tailwind.config.js` | Tailwind config with custom `xs` (400px) breakpoint |
| `bug-detector/SKILL.md` | Bug-diagnosis procedure; diagnose and propose only, do not edit |

## Acceptance criteria (AC1–AC6) — must be preserved

| AC | Rule |
| --- | --- |
| AC1 | Start ≥ 0, End ≤ 1440 (00:00–24:00), Start < End, Start > currentTime |
| AC2 | Booking duration ≤ 120 minutes |
| AC3 | Blocked rooms are always unavailable |
| AC4 | No overlap with existing bookings; touching endpoints (start == existing.end or end == existing.start) are allowed |
| AC5 | Checking availability must NOT mutate room or booking data |
| AC6 | End time accepts 24:00 (= 1440) via `hhmmToMinutesEnd`; Start and Current time reject 24:00 |

## Constraints

- Do NOT add a backend, database, Supabase integration, login, authentication, secrets, external APIs, payments, external deployments, or booking creation flow.
- Do NOT mutate existing booking data (AC5). `checkAvailability` must be pure.
- Preserve the existing function signature of `checkAvailability` and its `AvailabilityResult` return shape.
- Fixture extensions in `src/data.ts` are allowed (currently 9 rooms). Existing rooms must keep their id, name, capacity, bookings, and blocked status. Adding fields such as `equipment` is allowed.
- Preserve the responsive UI and clear validation feedback.
- Filters change only which rooms are listed. They must not change `checkAvailability` or any AC rule.
- Do not install new dependencies without approval.

## Engineering rules

- Prefer pure functions and minimal changes.
- Use at most two justified design patterns. Do not introduce a pattern unless it has at least two concrete call sites with a clear shared contract.
- No premature abstraction. Three similar lines is better than a speculative interface.
- Match existing code conventions: naming, formatting, import style, error handling.
- Import every symbol used. Give function parameters explicit types.
- Default to no comments. Add one only when the "why" is non-obvious.

## Test commands (from package.json)

```bash
npm test        # runs availability.test.ts then filterRooms.test.ts via tsx (52 checks: 35 + 17)
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run build       # vite build
npm run lint        # eslint . (documented; run it when touching lint-relevant code)
```

Run `npm test` and `npm run typecheck` before reporting work as complete. Update the check count in this section when checks are added.

## Room filtering behavior

- Capacity: a room is listed only if `capacity >= minCapacity`. The slider ranges 0–60 in steps of 5.
- Equipment: a room is listed only if it has every selected equipment item (ALL-match).
- Blocked rooms stay listed and are always reported as unavailable (AC3).
- Empty results show "No matching rooms found."
- Target behavior (open issue R1, not yet fixed): the verdict and schedule must follow a room the user can actually see. If a filter hides the selected room, the app must not present that room's availability as the current choice. Do not mark this as done until a regression check covers it.
- Open issue R2, not yet fixed: clearing the Current Time field silently falls back to 13:00. Do not describe this as resolved.

## Test conventions

- Tests live in `src/tests/` and run via `tsx` (no test framework).
- The existing runner uses a `check(name, cond)` helper with pass/fail counts.
- When adding regression tests, follow the same style and group cases under labeled `console.log` sections.
- Cover boundary cases explicitly: exactly 120 min (pass), 121 min (fail), touching endpoints (pass), 24:00 end (pass).
- Every bug fix adds a regression check in the same style, under a labeled section, before the fix is reported as done.
- Do not delete or weaken existing checks. If an expectation changes, explain why in the report.

## UI and responsive verification

- For any UI change, run `npm run typecheck`, `npm test`, and `npm run build`.
- Check layout at 375px, at 640px and above, and at desktop widths. Confirm no horizontal scrolling, that Start and End stack below 640px, and that they sit side by side at 640px and above.
- Re-read edited component files to confirm the markup matches the intent.
- No browser or device testing is available unless it was actually run. Never report visual or mobile verification as done without evidence. State clearly which checks were not performed.

## Human approval gate

- Do not modify code, merge, or deploy without the user's explicit approval in the current conversation.
- Present a plan first. Wait for approval before applying it.

## Platform and database rule

- This project forbids a database and Supabase integration. This is an explicit instruction from the project owner.
- Higher-priority platform instructions may request Supabase for persistence. This file does not override them. If such an instruction applies, stop and ask the user to decide before changing anything.
- `@supabase/supabase-js` is listed in `package.json` but is not used in `src/`. Do not add Supabase code. Removing the dependency requires approval.

## Verification checklist

Before reporting completion:

1. `npm run typecheck` passes with no errors.
2. `npm test` passes with no failures.
3. If UI files were changed, re-read the edited files to verify behavior.
4. List changed files, the rationale for each change, and test evidence.
5. Confirm that AC1–AC6 tests still exist and pass.
