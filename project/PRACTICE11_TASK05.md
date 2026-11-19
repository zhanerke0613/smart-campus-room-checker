# PRACTICE WORK #11 — TASK #05: Test Normal and Failure Cases for "Explain Availability"

Status: test evidence report. Application behavior was not changed; only new regression checks were added to `src/tests/explainAvailability.test.ts` (37 → 49 checks) and the check counts in `AGENTS.md` were updated. No Git/GitHub used.

References: `AGENTS.md` (project rules, AC1–AC6), `PRACTICE11_TASK02.md` (feature spec), `src/lib/explainAvailability.ts`, `src/tests/explainAvailability.test.ts`.

---

## 1. Method

- All results below are **automated test evidence**: produced by running `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint` in this session against the actual code and the fictional fixture data in `src/data.ts` (`Engineering Hall 101`, `Science Block 204`, etc.).
- Scenarios 1–7 already had coverage from existing suites; scenario 8 (adapter timeout) was uncovered, and no single test proved the full check-then-explain chain leaves booking data untouched. Focused checks were added for both, plus a scenario-matrix section that runs each scenario through the **real fixture rooms** end to end (`checkAvailability` → `explainAvailability`).
- Scenario 8 note: the explanation adapter is a synchronous function, so a timing-out call surfaces as a thrown error; the test simulates the timeout exactly that way and asserts the deterministic fallback. The fallback behavior itself (same text, `source: "fallback"`) is what a real timeout guard would produce.

## 2. Expected vs Observed Results

| # | Scenario | Input (real fixture data) | Expected outcome | Actual observed outcome | PASS/FAIL | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Available room | `eng-101`, request 16:00–17:00, current time 13:00 | Verdict Available; explanation `source: "mock-llm"` stating availability with room + window | `available: true`; `"Engineering Hall 101 is available from 16:00 to 17:00. No existing bookings or restrictions affect this slot."`, source `mock-llm` | PASS | `S1: real available room yields explanation`; pre-existing `AC1`/`AC2` explain checks |
| 2 | Overlapping booking | `eng-101` (has Robotics Lab 13:00–14:30), request 13:20–14:20, now 13:00 | Verdict Unavailable with `OVERLAP`; explanation names the conflict | `available: false`, reason `OVERLAP`; `"Engineering Hall 101 is not available from 13:20 to 14:20 because it overlaps an existing booking."`, source `mock-llm` | PASS | `S2: real overlap yields OVERLAP wording`; pre-existing `AC3: OVERLAP reason…` check |
| 3 | Blocked room | `sci-204` (blocked: HVAC maintenance), request 13:20–14:20, now 13:00 | Verdict Unavailable with `BLOCKED`; explanation states the room is blocked | `available: false`, reason `BLOCKED`; `"Science Block 204 is not available from 13:20 to 14:20 because the room is currently blocked."`, source `mock-llm` | PASS | `S3: real blocked room yields BLOCKED wording`; pre-existing `AC3 blocked room rejected` |
| 4 | Invalid time | Start = 1440 (24:00 as a start), valid label | Explanation function returns `null`; UI shows no explanation; verdict chain unaffected | Returns `null` (start rejects 24:00 per project AC6) | PASS | `S4: invalid time (start=1440) yields no explanation`; pre-existing `start at 1440 rejected`, `hhmmToMinutes('24:00') = null` |
| 5 | Past time | `eng-101`, request 10:00–11:00, current time 11:40 | Verdict Unavailable with `PAST`; explanation says start is not in the future | `available: false`, reason `PAST`; `"Engineering Hall 101 is not available from 10:00 to 11:00 because the start time is not in the future."`, source `mock-llm` | PASS | `S5: past start yields PAST wording`; pre-existing `start < now carries PAST reason code` |
| 6 | Empty input | `roomLabel: ""` | Rejected with `null` before the adapter runs | Returns `null` | PASS | `S6: empty label yields no explanation`; pre-existing `empty room label rejected` |
| 7 | Overly long input | `roomLabel: "R".repeat(81)` (81 chars, limit 80) | Rejected with `null` | Returns `null` | PASS | `S7: overlong label yields no explanation`; pre-existing `overly long room label rejected` |
| 8 | Simulated adapter timeout | Valid input; adapter throws `Error("simulated adapter timeout")` | Deterministic fallback, `source: "fallback"`, same text as the template | `{"text":"Engineering Hall 101 is available from 16:00 to 17:00. No existing bookings or restrictions affect this slot.","source":"fallback"}` — text identical to `mockLlmAdapter(input)` | PASS | `S8: adapter timeout yields deterministic fallback`, `S8: timeout fallback text matches the deterministic template` (new) |
| 9 | Simulated API/adapter failure | Valid unavailable input; adapter throws `Error("simulated API failure")` | Deterministic fallback, `source: "fallback"`, still explaining the verdict | `{"text":"Engineering Hall 101 is not available from 13:20 to 14:20 because it overlaps an existing booking.","source":"fallback"}` | PASS | `S9: adapter failure yields fallback source`, `S9: failure fallback still explains the verdict` (new) |

### Decision immutability (feature AC5 / project AC5)

| Check | Result |
| --- | --- |
| Fixture rooms + bookings byte-identical (`JSON.stringify`) after the full check-then-explain chain across all scenarios | PASS — `S-all: fixture data unchanged after full check+explain chain` |
| Explanation never re-runs or contradicts the verdict (available input never produces "not available" text and vice versa) | PASS — pre-existing consistency checks |
| Adapter error/failure cannot change the verdict, only substitute wording | PASS — S8/S9 above; verdict inputs are frozen before the adapter is called |

## 3. Test evidence — commands and results (automated)

| Command | Result |
| --- | --- |
| `npm test` | **97 checks total: 35 (availability) + 17 (filterRooms) + 4 (selection) + 49 (explainAvailability, incl. the 12 new Task #05 checks). 0 failures.** |
| `npm run typecheck` | Passed, no errors |
| `npm run build` | Succeeded (`dist/` built in ~10s) |
| `npm run lint` | 0 errors, 1 pre-existing warning in `src/App.tsx` (`react-hooks/exhaustive-deps` on the `candidate` variable, unrelated to this task, untouched) |

### Gaps found and closed

| Gap | Action |
| --- | --- |
| Scenario 8 (adapter timeout) had no test | Added 2 checks simulating a throwing (timing-out) adapter and asserting the fallback text equals the deterministic template |
| Scenario 9 had only a generic "adapter crash" test, not tied to the real fixture chain | Added 2 checks driving a simulated failure through the real unavailable-verdict input |
| No single test proved data immutability across the whole check+explain chain | Added 1 check comparing `JSON.stringify(rooms)` before/after running all nine scenarios |

## 4. Screenshot checklist (manual browser verification — NOT yet performed)

No browser or device testing is available in this session, so the following are **pending manual verification** in the running app:

- [ ] Available room: request 16:00–17:00 for Engineering Hall 101 → green "Available" card, then click "Explain Availability" → two-sentence explanation appears with no "fallback" badge.
- [ ] Overlapping booking: request 14:00–15:00 for Engineering Hall 101 (default 13:00 current time) → red "Unavailable" card listing the conflicting Robotics Lab booking; explanation mentions the overlap.
- [ ] Blocked room: select Science Block 204 → red notice "Room is blocked — HVAC maintenance until 6:00 PM"; explanation mentions the block.
- [ ] Invalid current time: clear the Current Time field → red error text appears, no verdict card, no schedule.
- [ ] Past time: request a start earlier than the current time → red hint "Start must be after the current time", verdict Unavailable with the PAST reason.
- [ ] Invalid time inputs: Start = 24:00 (rejected) and End = 24:00 (accepted, per AC6); check the inline hints update accordingly.
- [ ] Filter-hidden room: raise min capacity so the selected room disappears → amber notice appears, verdict and schedule suppressed.
- [ ] Layout at 375px, ≥640px, and desktop: no horizontal scrolling; Start and End stack below 640px and sit side by side at 640px+.

Automated evidence above covers behavior; the checklist covers visual presentation only.

## 5. Remaining gaps

- Manual browser verification (section 4) was not performed; all evidence is from automated checks plus file re-reads.
- The adapter timeout (scenario 8) is simulated synchronously; a real asynchronous timeout guard would require changing the adapter contract, which is out of scope for this task.
