# PRACTICE WORK #11 — TASK #06: Agentic Code Review Report

Status: read-only review. No application code, tests, dependencies, or AGENTS.md were modified. No Git/GitHub used.

---

## 1. Scope and method (baseline statement)

**Baseline caveat (explicit):** No Git repository and no baseline ZIP exist in this environment (`*.zip` searched in the project root and parent directory — none found). This review is therefore based on the **current files and the documented change history** in `PRACTICE11_TASK02.md` (feature spec), `PRACTICE11_TASK04.md` (prompt variants doc), `PRACTICE11_TASK05.md` (test evidence report), and `AGENTS.md` — **not a verified diff**. Files documented as original-baseline (pre-Task-#03): `App.tsx`, `DecisionCard.tsx`, `availability.ts`, `filterRooms.ts`, `selection.ts`, `time.ts`, `data.ts`, `types.ts`, and the three original test suites. Files introduced by Practice Work #11: `src/lib/explainAvailability.ts`, `src/tests/explainAvailability.test.ts`, plus modifications to `App.tsx`, `DecisionCard.tsx`, `package.json`, and `AGENTS.md`.

**No README.md exists in the project** — noted as a documentation gap (section 6).

Review dimensions: correctness, security, maintainability, performance, input/output validation, prompt-injection handling, deterministic fallback, UI state consistency, test coverage. Probes were executed against the real code with `npx tsx` (see evidence per finding); full suite re-run: **105 checks pass (35 + 17 + 4 + 49), 0 failures**; typecheck passes; build succeeds; lint = 0 errors, 1 pre-existing warning.

## 2. Findings table (summary)

| ID | Description | Severity | File:line | Status |
| --- | --- | --- | --- | --- |
| F-1 | Unavailable verdict with an empty reasons array would crash `handleExplain` | Low | `src/App.tsx:86` | **Unsupported** (disproven) |
| F-2 | Stale explanation could render under a changed verdict | Medium | `src/App.tsx:80–82` | **Unsupported** (disproven — already handled) |
| F-3 | Room labels containing abbreviation periods break the fallback path for valid inputs | Medium | `src/lib/explainAvailability.ts:79–84, 91` | **Confirmed** |
| F-4 | Only the first reason code is explained when multiple rules fail | Low | `src/lib/explainAvailability.ts` (design), `src/App.tsx:86` | **Confirmed** (by-design limitation, documented) |
| F-5 | Sanitization can make a label exceed the 80-char limit *after* expansion? (control-char → space expansion) | Low | `src/lib/explainAvailability.ts:30–38` | **Unsupported** (disproven) |
| F-6 | Explanation text is rendered without explicit XSS sanitization | High (if real) | `src/components/DecisionCard.tsx:111` | **Unsupported** (disproven — React escapes) |

## 3. Detailed findings

### F-1 — Unavailable verdict with empty reasons crashes `handleExplain`

1. **Description:** `handleExplain` reads `result.reasons[0].code` when `result.available` is false. If an unavailable result ever had zero reasons, `reasons[0]` would be `undefined` and `.code` would throw a TypeError.
2. **Severity:** Low (if it were reachable).
3. **Affected file/line:** `src/App.tsx:86` — `const reasonCode = result.available ? null : result.reasons[0].code;`
4. **Code evidence:** In `src/lib/availability.ts:102`, the verdict is `available: reasons.length === 0` — i.e. `available === false` **implies** `reasons.length >= 1` by construction. The invariant is structural: the verdict is derived from the same array that is indexed.
5. **Reproduction/verification:** Exhaustively probed the checker with real fixtures (e.g. `checkAvailability(eng101, 800, 860, 780)` → `available: false, reasons: ['OVERLAP']`; multi-failure probe → `['TOO_LONG','OVERLAP']`). Every unavailable verdict carries ≥ 1 reason. No counterexample exists because the boolean is computed as `reasons.length === 0`.
6. **Minimal suggested fix:** None required. A defensive `result.reasons[0]?.code ?? null` would be harmless but is unnecessary given the structural invariant.
7. **Status: Unsupported** — investigation disproves the hypothesis; the invariant makes the crash unreachable.

### F-2 — Stale explanation rendered under a newer verdict

1. **Description:** After clicking "Explain Availability", changing the room or time inputs changes the verdict; the previously generated explanation might remain visible beneath a verdict it no longer describes — a UI-state-consistency defect (feature AC5: explanation must not contradict the shown verdict).
2. **Severity:** Medium (if real).
3. **Affected file/line:** `src/App.tsx:80–82` — `useEffect(() => { setExplanation(null); }, [result]);`
4. **Code evidence:** The effect's dependency is `result`, the memoized verdict object. Any change to room, start, end, or current time produces a new `result` (a fresh object from `useMemo`, or `null`), firing the effect and clearing the explanation. This guard was introduced with the feature (Task #03) precisely for this reason (comment on line 79: "A stale explanation must never sit under a newer verdict").
5. **Reproduction/verification:** Code inspection: `result` is recreated by `useMemo` on every change of `[selectedRoom, candidate, nowMin]` (`App.tsx:74–77`); `candidate` is a fresh object literal each render when times are valid, so even re-selecting the same room resets. When `result` becomes `null` (invalid times / filtered-out room), the effect also fires, and `DecisionCard` is not rendered at all (`App.tsx:244`), so a stale explanation cannot be visible in that state either.
6. **Minimal suggested fix:** None required.
7. **Status: Unsupported** — disproven; the existing effect fully handles the transition, including the `result → null` path.

### F-3 — Labels with abbreviation periods are pushed to the fallback path (false-positive output rejection)

1. **Description:** `countSentences` splits on `[.!?]`, counting "St." in a label like "St. Andrews Hall Annex" as a sentence boundary. The adapter's two-sentence template then counts as **three** sentences, `isValidExplanationText` rejects its own valid template output, and `explainAvailability` returns the same text via the fallback path. The user sees the correct wording but with the "fallback" badge and `source: "fallback"` — a false positive of output validation for a perfectly valid input.
2. **Severity:** Medium. The text shown is still factually correct (the fallback is the same template), so no wrong information is displayed; the impact is a misleading "fallback" badge and wrong telemetry source for any room whose name contains ".", "Mr.", "Rm." etc. — plausible for campus room names.
3. **Affected file/lines:** `src/lib/explainAvailability.ts:79–84` (`countSentences`), `:91` (label containment check passes, but sentence count fails).
4. **Code evidence (executed probe, this session):**
   - `explainAvailability({ roomLabel: "St. Andrews Hall Annex", startTime: 840, endTime: 900, isAvailable: true, reasonCode: null })` returned `{"text":"St. Andrews Hall Annex is available from 14:00 to 15:00. No existing bookings or restrictions affect this slot.","source":"fallback"}`.
   - Sentence parts for that text: `["St", "Andrews Hall Annex is available from 14:00 to 15:00", "No existing bookings..."]` → count 3 > 2 → rejected. Same template with "Engineering Hall 101" → count 2 → accepted.
   - Existing tests never exercise a label containing a period, which is why the suite is green despite this.
5. **Reproduction:** Run the probe above with any label containing "St." — the returned `source` is `"fallback"` instead of `"mock-llm"`.
6. **Minimal suggested fix:** Either (a) count sentences after removing the label from the text (`text.replace(roomLabel, "").split(...)`) so the label's internal punctuation is not counted, or (b) require the count to be ≤ 2 plus the number of periods contained in the label. Option (a) is the smallest change.
7. **Status: Confirmed** — reproduced by direct execution, not merely hypothesized.

### F-4 — Only the first reason code is explained when multiple rules fail

1. **Description:** With multiple simultaneous failures (e.g. a 660-minute slot that also overlaps a booking), only `reasons[0]` is passed to the adapter; the explanation names the duration problem but not the overlap. Feature AC4 caps the explanation at two sentences regardless of reason count (spec §4), so this is a **deliberate design trade-off**, not an unhandled defect.
2. **Severity:** Low.
3. **Affected file/lines:** `src/lib/explainAvailability.ts` (single `reasonCode` in `ExplanationInput`, line 8), `src/App.tsx:86` (`result.reasons[0].code`).
4. **Code evidence:** Spec section 2 defines the input as a single `reasonCode: string | null` ("First reason code from the checker"); AC4 explicitly limits length as reason count grows. Executed probe: `checkAvailability(eng101, 780, 1440, 700)` → reasons `['TOO_LONG','OVERLAP']`; explanation states only the TOO_LONG meaning — consistent with spec.
5. **Reproduction/verification:** Probe above; spec comparison confirms intended behavior.
6. **Minimal suggested fix:** None required. If ever desired, the second sentence could enumerate remaining reasons — but that must not be done at the cost of AC4.
7. **Status: Confirmed** as a limitation, and **Confirmed as by-design** per the spec (not a defect).

### F-5 — Sanitization expands control characters, possibly pushing a valid 80-char label over the limit

1. **Description hypothesis:** `sanitizeLabel` replaces each control character with a space; a label of 80 chars that is shortened by trimming but contains control chars could change length in either direction, potentially rejecting or distorting valid labels.
2. **Severity:** Low.
3. **Affected file/line:** `src/lib/explainAvailability.ts:30–38`.
4. **Code evidence:** Control chars map 1:1 to a space, then whitespace runs collapse to single spaces — the label only ever shrinks or stays the same length after collapsing; expansion cannot happen (each `\u00A0`-type whitespace also collapses). A label consisting solely of control characters becomes empty and is correctly rejected.
5. **Reproduction/verification:** Executed probes: 80-char label passes (`true`); control-only label (`\u0000\u0001\u0002`) returns `null` (correct rejection); the Task-#05 suite already covers whitespace normalization (`"  Eng   Hall  "` → `"Eng Hall"`).
6. **Minimal suggested fix:** None required.
7. **Status: Unsupported** — disproven; sanitize-then-collapse can only shorten.

### F-6 — Explanation text rendered without explicit XSS sanitization

1. **Description:** The explanation (which embeds user-visible room names, i.e. fixture data that could in principle contain arbitrary text) is rendered directly as `{explanation.text}` — an AI-review heuristic flags any unsanitized interpolation as an injection risk.
2. **Severity:** High if a raw `innerHTML`-style sink were used; **not applicable** as written.
3. **Affected file/line:** `src/components/DecisionCard.tsx:111` — `{explanation.text}`.
4. **Code evidence:** React escapes all interpolated strings before DOM insertion; there is no `dangerouslySetInnerHTML`, no `innerHTML`, and no `document.write` anywhere in `src/`. Additionally, input validation caps the text at 400 chars, strips control characters, and forbids newlines — and the text can only ever be the template output (both adapter and fallback emit fixed templates with the label interpolated).
5. **Reproduction/verification:** Searched `src/` for DOM-injection sinks (none). The full chain from user input to render is: sanitize → validate → fixed template → React escaping.
6. **Minimal suggested fix:** None required. Do not introduce `dangerouslySetInnerHTML`.
7. **Status: Unsupported** — disproven; no injection sink exists in the codebase.

## 4. Manual inspection checklist (independent of the AI-style probes above)

| # | Checklist item | Method | Result |
| --- | --- | --- | --- |
| 1 | Existing AC1–AC6 untouched; `checkAvailability` signature and `AvailabilityResult` shape unchanged | Read `availability.ts`, `types.ts`; compared against AGENTS.md contract | Pass — no changes to either file |
| 2 | Feature never re-runs `checkAvailability` and cannot mutate data (feature AC5) | Read `explainAvailability.ts` (no import of `availability`), executed full-chain immutability check (Task #05 suite, `S-all` check) | Pass |
| 3 | Input validation completeness: types, ranges, cross-field rules | Line-by-line read of `validateExplanationInput`; boundary probes (0, 1440, 80/81 chars, control-only labels) | Pass — one design note: `startTime` must be < 1440 and `endTime` > 0 are correct per AC6 asymmetry (start rejects 24:00, end accepts it) |
| 4 | Deterministic fallback: same inputs → same output, `source: "fallback"` | Re-ran throwing-adapter probe twice and compared strings; Task #05 S8/S9 checks assert text equality with the template | Pass |
| 5 | Prompt-injection handling: injected text cannot flip the verdict | Executed injection probes (both verdict directions) from the test suite against the live module | Pass — injected text is interpolated as inert data; verdict wording unchanged |
| 6 | UI state consistency: stale explanation, suppressed verdict paths | Read `App.tsx` effect and render conditions; verified `DecisionCard` renders only when `result && candidate` | Pass — F-2 disproven |
| 7 | No network, keys, `.env` reads, or new dependencies in the feature | Read `explainAvailability.ts` imports (`./time` only); `package.json` unchanged in dependencies | Pass |
| 8 | Test suite integrity: no existing checks weakened or deleted | Counted per-suite results: 35 + 17 + 4 unchanged; explain suite grew 37 → 49 (Task #05 additions only) | Pass |
| 9 | Documentation consistency: AGENTS.md counts match reality | Ran suite (105 total) and compared with AGENTS.md test-count line | Pass |
| 10 | Performance: no hot-path work added | The feature runs only on button click; `useMemo`/`useEffect` additions are O(1) per render | Pass — no measurable risk |

**AI vs. manual distinction:** The findings in section 3 originated from AI-style hypothesis-driven probing (F-1, F-2, F-5, F-6 were candidate hypotheses; F-3 and F-4 emerged from executed probes). The manual checklist above was then applied independently. Every **Unsupported** finding was disproven by the manual evidence (structural invariants, React's escaping guarantee, executed boundary probes), while **F-3** survived both routes — it was reproduced by execution and missed by the existing test suite.

## 5. Security and privacy review (spec §7 compliance)

- No API keys, no `.env` reads, no network calls, no database: verified by import inspection and `package.json` diff-free state.
- No personal data reaches the adapter: only `roomLabel`, times, verdict, and reason code; `bookedBy` and booking titles are never passed.
- Injection resistance: validated by executed probes; embedded instructions are inert text.
- Output can never contradict the verdict: both the adapter and the fallback derive wording solely from the frozen `isAvailable`/`reasonCode` pair; consistency checks in the suite assert this.

## 6. Documentation and minor observations (no code change required)

1. **No README.md exists.** The project relies on `AGENTS.md` and the task documents. Consider adding one if the practice requires it.
2. The single lint warning (`react-hooks/exhaustive-deps` on `candidate`, `App.tsx:69`) predates Practice Work #11 and is documented in AGENTS.md; wrapping `candidate` in `useMemo` would silence it but is out of scope for a read-only review.
3. `dist/` is committed to the working tree (built assets present). Harmless for this practice, but a `.gitignore`-style convention would exclude it in a real repository.

## 7. Verification commands (re-run for this review)

| Command | Result |
| --- | --- |
| `npm test` | 105 checks passed, 0 failed (35 + 17 + 4 + 49) |
| `npm run typecheck` | Passed, no errors |
| `npm run build` | Succeeded (~1.9 s) |
| `npm run lint` | 0 errors, 1 pre-existing warning |

Note: dependencies had to be reinstalled (`npm ci`) at the start of this session before the suite would run (`tsx: not found`); after reinstall all commands passed. This is an environment issue, not a project defect.

## 8. Conclusion

One **Confirmed** defect (F-3, Medium): labels containing abbreviation periods are falsely pushed to the fallback path by the sentence-count validator. One **Confirmed by-design** limitation (F-4, Low): only the first reason is explained, per the feature spec. Four hypotheses (F-1, F-2, F-5, F-6) were investigated and **disproven** with structural or executed evidence, and are documented here explicitly rather than omitted. No high-severity issues exist. The feature preserves all existing acceptance criteria, tests, and behavior.
