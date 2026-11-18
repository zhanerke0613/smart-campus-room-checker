# PRACTICE WORK #11 — TASK #02: "Explain Availability" Feature Specification

Status: specification only — no application code has been modified.

## 1. User story

> As a student, I want a short explanation of room availability so I understand the decision.

The student sees an Available / Unavailable verdict in the existing app. This optional feature adds one or two plain-language sentences beneath the verdict, explaining *why* — e.g. "Engineering Hall 101 is free for 14:00–15:00 because it has no bookings in that window." The explanation never changes the decision itself.

## 2. Inputs

| Input | Type | Source | Example |
| --- | --- | --- | --- |
| `roomLabel` | `string` | Selected room's display name | `"Engineering Hall 101"` |
| `startTime` | `number` (minutes from midnight) | Requested Start field | `840` (14:00) |
| `endTime` | `number` (minutes from midnight, 1440 = 24:00) | Requested End field | `900` (15:00) |
| `isAvailable` | `boolean` | Existing availability checker verdict | `true` |
| `reasonCode` | `string \| null` | First reason code from the checker, or `null` when available | `"OVERLAP"` |

Reason codes come from the existing checker unchanged: `BOUNDS`, `ORDER`, `PAST`, `TOO_LONG`, `BLOCKED`, `OVERLAP`.

## 3. Output

A single object:

```ts
interface Explanation {
  text: string;       // at most two sentences
  source: "mock-llm" | "fallback";
}
```

- `text`: exactly one or two sentences, plain language, mentions the room label and the time window.
- `source`: records whether the adapter produced the text or the deterministic fallback was used.
- The output object contains **only** the fields above — no room ids, bookings, or personal data.

## 4. Feature acceptance criteria (AC1–AC5 for this feature)

These are the new feature's own criteria. They are additive; the project's existing AC1–AC6 availability rules (in AGENTS.md) are unchanged and take precedence over any wording here.

- **AC1 (valid input → explanation):** Given valid inputs per section 2, calling the explanation function returns an `Explanation` whose `text` is one or two sentences, non-empty, and contains the room label and a human-readable time window.
- **AC2 (available verdict wording):** When `isAvailable` is `true`, the explanation states the room is available for the requested window and gives a positive justification (e.g. no conflicting bookings, not blocked).
- **AC3 (unavailable verdict wording):** When `isAvailable` is `false`, the explanation states the room is not available and names the human-readable meaning of the given `reasonCode` (e.g. `OVERLAP` → mentions an existing booking conflict).
- **AC4 (length limit):** No explanation ever exceeds two sentences, regardless of the number of reason codes supplied.
- **AC5 (decision immutability):** The explanation function is pure and read-only: it never mutates room or booking data, never calls `checkAvailability` itself, and its output cannot change the Available / Unavailable verdict shown in the UI.

## 5. Failure behavior

- **Invalid input:** Malformed or missing inputs (empty room label, non-numeric or out-of-range times, unknown reason code, `isAvailable` not a boolean) are rejected — the function returns `null` and the UI shows no explanation rather than a wrong one.
- **Adapter errors and timeouts:** If the mock LLM adapter throws, returns a malformed response, or exceeds a timeout, the adapter catches it and returns a **deterministic fallback** built from a fixed template keyed on `isAvailable` + `reasonCode` (e.g. `"Engineering Hall 101 is unavailable for 14:00–15:00 because of an existing booking conflict."`). The fallback is identical for the same inputs on every run — no randomness, no network retries visible to the user. The returned object has `source: "fallback"`.
- In both failure cases the app's verdict, schedule, and all existing behavior are unaffected.

## 6. Architecture diagram

```
Student Input (room label, start/end time, verdict, reason code)
        │
        ▼
┌───────────────┐
│  Validation   │  reject invalid input → null (no explanation shown)
└───────┬───────┘
        ▼
┌───────────────────────────────┐
│ Existing Availability Checker │  (read-only reuse of checkAvailability
│   checkAvailability result    │   verdict — this feature never re-runs it)
└───────┬───────────────────────┘
        ▼
┌───────────────────┐
│ Structured Result │  { roomLabel, startTime, endTime, isAvailable, reasonCode }
└───────┬───────────┘
        ▼
┌───────────────────┐
│ Mock LLM Adapter  │  generates text; on error/timeout → deterministic fallback
└───────┬───────────┘
        ▼
┌──────────────────────┐
│ Validated Explanation│  { text: ≤ 2 sentences, source }
└───────┬──────────────┘
        ▼
┌───────────────────┐
│        UI         │  rendered under the verdict in DecisionCard
└───────────────────┘
```

## 7. Security and privacy

- **No API keys:** No real LLM service is used. The mock adapter runs locally in memory; no keys, secrets, or `.env` values are read, logged, or transmitted.
- **No personal data:** Inputs contain only fictional room labels and times. The booking fields `bookedBy` and any user-entered data are never sent to the adapter and never appear in explanations.
- **AI cannot change booking decisions:** The adapter receives a frozen, already-computed verdict and can only produce text. It cannot call `checkAvailability`, mutate room or booking data (existing AC5), alter filters, or change the Available / Unavailable verdict. Its output is length-validated before rendering, and any malformed output triggers the deterministic fallback.
- No network calls, no external APIs, no database, no login.

## 8. Implementation scope and constraints

- Scope: one room at a time (matching the existing single-room verdict), fictional bookings from `src/data.ts`, no login, no database, no backend.
- Optional feature: if inputs are invalid or the adapter fails, the app behaves exactly as it does today.
- The existing AC1–AC6 availability rules, the `checkAvailability` signature and `AvailabilityResult` shape, and all **56 existing tests (35 + 17 + 4)** must be preserved unchanged.
- New tests for this feature follow the existing `check(name, cond)` style under `src/tests/`, and the test-count line in AGENTS.md is updated only when the feature is implemented and approved.
- No new dependencies; the mock adapter is a plain TypeScript module.
