// Client-safe DTO shapes. These intentionally exclude cost/revenue, internal IDs,
// recording URLs, and assistant config — the same allowlist the future server-side
// proxy will enforce. The demo's static JSON already matches this contract, so
// wiring to the live Assistable API later is a data-source swap, not a rewrite.

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";

export type CallStatus =
  | "COMPLETED"
  | "NO_ANSWER"
  | "BUSY"
  | "FAILED"
  | "CANCELED";

export interface TranscriptLine {
  role: "agent" | "caller";
  text: string;
}

export interface CallRecord {
  id: string;
  direction: "inbound" | "outbound";
  status: CallStatus;
  answered: boolean;
  afterHours: boolean;
  contactName: string;
  contactPhoneMasked: string;
  durationSeconds: number;
  sentiment: Sentiment;
  summary: string;
  startedAt: string; // ISO
  assistantName: string;
  hasRecording: boolean;
  /** Our auth-gated proxy path (e.g. /api/recording/{id}) — NOT the raw R2 URL. */
  recordingUrl?: string;
  transcript?: TranscriptLine[];
}

export interface Stats {
  totalCalls: number;
  completedCalls: number;
  errorCalls: number;
  totalDurationMinutes: number;
  avgDurationSeconds: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface ConversationStats {
  total: number;
  active: number;
  totalMessages: number;
  aiMessages: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  calls: number;
  answered: number;
}

export type RangeKey = "7" | "30" | "60" | "90";

export interface RangeData {
  days: number;
  stats: Stats;
}

export interface Snapshot {
  generatedAt: string;
  client: {
    name: string;
    assistantName: string;
    timezone: string;
  };
  rangeDays: number;
  stats: Stats;
  conversationStats?: ConversationStats;
  dailyTrend: DailyPoint[];
  dailyTrend90: DailyPoint[];
  ranges: Record<RangeKey, RangeData>;
  calls: CallRecord[];
}

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "60", label: "60 days" },
  { key: "90", label: "90 days" },
];
