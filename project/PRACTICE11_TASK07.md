# PRACTICE WORK #11 — TASK #07: Repair and Regression-Test Report

Status: F-3 reproduced with a failing test, fixed minimally, and verified. No other code, findings, or behavior changed. No Git/GitHub, database, login, or real API used.

References: `AGENTS.md`, `PRACTICE11_TASK02.md`, `PRACTICE11_TASK05.md`, `PRACTICE11_TASK06.md` (Task #06 review — source of the findings).

---

## 1. Confirmed findings under review (from Task #06)

| ID | Summary | Task #06 status | Action this task |
| --- | --- | --- | --- |
| F-3 | Labels containing periods ("St. Andrews Hall Annex") made the sentence-count validator reject the adapter's own valid template, producing an unnecessary fallback | Confirmed, Medium | **Fixed** (see section 2–4) |
| F-4 | Only the first reason code is explained when multiple rules fail | Confirmed as **by-design** (spec §2 defines a single `reasonCode`; AC4 caps length as reason count grows) | **Not changed** — no evidence it violates any acceptance criterion (section 5) |
| F-1, F-2, F-5, F-6 | Empty-reasons crash, stale explanation, sanitize expansion, XSS sink | All **Unsupported** (disproven in Task #06) | Not fixed — not actionable defects |

**Limitation stated honestly:** only one actionable confirmed defect (F-3) existed. No second defect was invented to fill the count.

## 2. Reproduction of F-3 (before the fix)

New regression checks were added first and run against the unfixed code. They **failed**, reproducing the defect:

```
Error: FAIL: F-3: dotted label keeps mock-llm source
    at check (src/tests/explainAvailability.test.ts:10:25)
```

Executed probe against the unfixed module:

- Input: `{ roomLabel: "St. Andrews Hall Annex", startTime: 840, endTime: 900, isAvailable: true, reasonCode: null }`
- Output before fix: `{ "text": "St. Andrews Hall Annex is available from 14:00 to 15:00. No existing bookings or restrictions affect this slot.", "source": "fallback" }`
- Root cause: `countSentences` split the whole text on `[.!?]+`, so the "St." inside the label counted as a sentence boundary → the two-sentence template counted as three → `isValidExplanationText` rejected its own valid output → fallback path with a misleading "fallback" badge.

## 3. Minimal fix applied

**File changed:** `src/lib/explainAvailability.ts` (only application file touched).

- `countSentences(text)` → `countSentences(text, roomLabel)`: the label is removed from the text before splitting on sentence boundaries, so punctuation inside the room name is never counted as a sentence terminator. (One short comment records the non-obvious "why".)
- `isValidExplanationText` now passes the validated label to both `countSentences` calls.

What was **preserved** (per instruction 4):

- The two-sentence output requirement — still enforced, now on label-independent text; the two-sentence cap test still passes.
- All output validation — 400-char cap, single-line requirement, label containment, sentence count all unchanged in kind.
- Input sanitization — `sanitizeLabel` and every `validateExplanationInput` rule untouched.
- The confirmed verdict path — the adapter still receives the frozen verdict; nothing re-runs `checkAvailability`.

## 4. Regression test results (after the fix)

Added 4 checks (suite: 49 → 53), all passing:

- `F-3: dotted label is accepted as valid input` — PASS
- `F-3: dotted label text matches the deterministic template` — PASS
- `F-3: dotted label keeps mock-llm source` — PASS (failed before the fix; this is the regression signal)
- `F-3: dotted label unavailable verdict keeps mock-llm source` — PASS

## 5. F-4 evaluation (separate, per instruction 5)

F-4 stays unchanged. Evidence: feature spec section 2 defines the adapter input as a single `reasonCode: string | null` ("First reason code from the checker"), and feature AC4 states "No explanation ever exceeds two sentences, regardless of the number of reason codes supplied." Explaining multiple reasons risks breaking AC4 and contradicts the specified input contract. No acceptance criterion requires enumerating every reason. The Task #06 executed probe (`checkAvailability` returning `['TOO_LONG','OVERLAP']` → explanation names the duration limit only) confirmed behavior is consistent with the spec. Conclusion: by-design limitation, no fix.

## 6. Full verification (exact results)

| Command | Result |
| --- | --- |
| `npm test` | **109 checks passed, 0 failed** (35 availability + 17 filterRooms + 4 selection + 53 explainAvailability). All pre-existing checks intact: 35 + 17 + 4 unchanged, and the 49 prior explain checks unchanged. |
| `npm run typecheck` | Passed, no errors |
| `npm run build` | Succeeded (~2.0 s, `dist/` regenerated) |
| `npm run lint` | 0 errors, 1 warning — the pre-existing `react-hooks/exhaustive-deps` advisory on `candidate` in `src/App.tsx:69`, untouched |

### Decision and data immutability check (instruction 9)

Executed post-fix probe driving the full chain (`checkAvailability` → `explainAvailability`) on the real fixture data with the dotted label: verdict still `available: false` with reason `OVERLAP`; explanation `source: "mock-llm"`; `JSON.stringify(rooms)` byte-identical before and after. The suite's existing `S-all` immutability check also passes.

## 7. Changed files

| File | Change |
| --- | --- |
| `src/tests/explainAvailability.test.ts` | +4 regression checks for F-3 (added before the fix; observed failing first) |
| `src/lib/explainAvailability.ts` | `countSentences` takes the validated label and strips it before counting sentence boundaries; call sites in `isValidExplanationText` updated. No other logic changed. |
| `AGENTS.md` | Test-count lines updated: 97 → 109 checks (35 + 17 + 4 + 53); explain-suite table entry notes the F-3 regression coverage. |
| `PRACTICE11_TASK07.md` | This report (new). |

## 8. Unresolved issues

- None from this task. F-3 is fixed and regression-tested; F-4 is documented as by-design and intentionally unchanged.
- Carried from prior tasks (not defects): the pre-existing lint warning; manual browser verification remains unperformed (no browser available — automated evidence only); the adapter is synchronous, so a real asynchronous timeout guard would require changing the adapter contract (out of scope, documented in Task #05).

## 9. Demonstration readiness

The app is ready to demo: `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint` all pass; the "Explain Availability" flow behaves identically for normal and dotted room labels (no spurious fallback badge); the confirmed Available/Unavailable verdict and all booking data are untouched by the fix.
