import { minutesToHHMM, minutesToHHMMEnd } from "./time";

export interface ExplanationInput {
  roomLabel: string;
  startTime: number; // minutes from midnight, < 1440
  endTime: number; // minutes from midnight, up to 1440 (24:00)
  isAvailable: boolean;
  reasonCode: string | null;
}

export interface Explanation {
  text: string; // at most two sentences
  source: "mock-llm" | "fallback";
}

export type MockLlmAdapter = (input: ExplanationInput) => string;

const REASON_MEANINGS: Record<string, string> = {
  BOUNDS: "the requested times fall outside the 00:00–24:00 window",
  ORDER: "the end time is not after the start time",
  PAST: "the start time is not in the future",
  TOO_LONG: "the requested slot is longer than the 120-minute limit",
  BLOCKED: "the room is currently blocked",
  OVERLAP: "it overlaps an existing booking",
};

const MAX_LABEL_LENGTH = 80;
const MAX_TEXT_LENGTH = 400;

function sanitizeLabel(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) out += ch;
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Reject empty, malformed, or overly long inputs (feature AC1/AC5, spec §5).
 * Returns a normalized copy, or null when the input must not reach the adapter.
 */
export function validateExplanationInput(
  input: ExplanationInput
): ExplanationInput | null {
  if (typeof input !== "object" || input === null) return null;
  const roomLabel =
    typeof input.roomLabel === "string" ? sanitizeLabel(input.roomLabel) : "";
  if (!roomLabel || roomLabel.length > MAX_LABEL_LENGTH) return null;
  const { startTime, endTime, isAvailable, reasonCode } = input;
  if (!Number.isInteger(startTime) || startTime < 0 || startTime >= 1440)
    return null;
  if (!Number.isInteger(endTime) || endTime <= 0 || endTime > 1440) return null;
  if (endTime <= startTime) return null;
  if (typeof isAvailable !== "boolean") return null;
  if (isAvailable) {
    if (reasonCode !== null) return null;
  } else {
    if (typeof reasonCode !== "string" || !(reasonCode in REASON_MEANINGS))
      return null;
  }
  return { roomLabel, startTime, endTime, isAvailable, reasonCode };
}

/**
 * Deterministic, offline stand-in for an LLM. Structured data only —
 * no network, no keys. User-supplied text is interpolated only after
 * sanitization, so embedded instructions can never be "followed".
 */
export const mockLlmAdapter: MockLlmAdapter = (input) => {
  const windowLabel = `from ${minutesToHHMM(input.startTime)} to ${minutesToHHMMEnd(input.endTime)}`;
  if (input.isAvailable) {
    return `${input.roomLabel} is available ${windowLabel}. No existing bookings or restrictions affect this slot.`;
  }
  return `${input.roomLabel} is not available ${windowLabel} because ${REASON_MEANINGS[input.reasonCode as string]}.`;
};

function countSentences(text: string, roomLabel: string): number {
  // Punctuation inside the room label (e.g. "St. Andrews") is not sentence
  // boundaries — strip the label before counting so the validator does not
  // reject the adapter's own valid template output.
  const withoutLabel = roomLabel ? text.split(roomLabel).join("") : text;
  return withoutLabel
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function isValidExplanationText(text: unknown, roomLabel: string): boolean {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("\n")) return false;
  if (trimmed.length > MAX_TEXT_LENGTH) return false;
  if (!trimmed.includes(roomLabel)) return false;
  return (
    countSentences(trimmed, roomLabel) >= 1 && countSentences(trimmed, roomLabel) <= 2
  );
}

/**
 * Validate input, run the adapter, validate its output; on any adapter
 * error or malformed/overlong output return the deterministic fallback.
 * Pure and read-only — the verdict is already computed and never re-run.
 */
export function explainAvailability(
  input: ExplanationInput,
  adapter: MockLlmAdapter = mockLlmAdapter
): Explanation | null {
  const valid = validateExplanationInput(input);
  if (!valid) return null;
  let text: unknown;
  try {
    text = adapter(valid);
  } catch {
    return { text: mockLlmAdapter(valid), source: "fallback" };
  }
  if (isValidExplanationText(text, valid.roomLabel)) {
    return { text: (text as string).trim(), source: "mock-llm" };
  }
  return { text: mockLlmAdapter(valid), source: "fallback" };
}
