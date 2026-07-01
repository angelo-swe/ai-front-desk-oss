// Generate the fully-synthetic demo snapshot (src/data/demo-snapshot.json).
//
// The demo tenant ("demo"/"demo") serves this static file so the dashboard works
// with zero setup and nothing real is exposed. Everything here is invented — a
// fictional "Acme Clinic" with assistant "Ava". Deterministic (seeded PRNG +
// fixed anchor date) so re-running produces the same file.
//
//   bun scripts/gen-demo-snapshot.ts
//
// Real tenants never use this — they pull live data from Assistable.

import { writeFileSync } from "node:fs";

const OUT = new URL("../src/data/demo-snapshot.json", import.meta.url);
const ANCHOR = "2026-06-30"; // demo "today"; dates are generated relative to this
const CLIENT = { name: "Acme Clinic", assistantName: "Ava", timezone: "America/New_York" };

// --- deterministic PRNG (mulberry32) so output is reproducible -----------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x5e5510); // fixed seed → reproducible output
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (lo: number, hi: number): number => lo + Math.floor(rnd() * (hi - lo + 1));

const FIRST = [
  "Jordan", "Riley", "Casey", "Morgan", "Avery", "Taylor", "Quinn", "Parker",
  "Drew", "Sage", "Reese", "Rowan", "Emerson", "Hayden", "Blake", "Cameron",
  "Devon", "Elliot", "Finley", "Harper", "Micah", "Lane", "Noel", "Skyler",
  "Tatum", "Wren", "Nico", "Presley", "Marlowe", "Kai",
];
const LAST_INITIAL = "ABCDEFGHJKLMNPRSTVW".split("");

type Turn = { role: "agent" | "caller"; text: string };
type Scenario = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  summary: (name: string) => string;
  transcript: (name: string) => Turn[];
  duration: [number, number];
};

const A = CLIENT.name;
const AVA = CLIENT.assistantName;

const SCENARIOS: Scenario[] = [
  {
    sentiment: "POSITIVE",
    duration: [180, 360],
    summary: (n) =>
      `${n} called ${A} to book a first wellness session. ${AVA} answered questions about availability and confirmed an appointment for later in the week.`,
    transcript: (n) => [
      { role: "agent", text: `Thank you for calling ${A}, this is ${AVA}. How can I help today?` },
      { role: "caller", text: "Hi, I'd like to book my first session." },
      { role: "agent", text: "Wonderful — I can help with that. Have you visited us before, or is this your first time?" },
      { role: "caller", text: "First time." },
      { role: "agent", text: `Great, welcome! We have openings Thursday morning. Would 10 AM work, ${n.split(" ")[0]}?` },
      { role: "caller", text: "Thursday at 10 works perfectly." },
      { role: "agent", text: "You're all set. You'll get a text confirmation shortly. See you Thursday!" },
    ],
  },
  {
    sentiment: "NEUTRAL",
    duration: [120, 240],
    summary: (n) =>
      `${n} asked about pricing and hours at ${A}. ${AVA} shared the current package options and weekday availability.`,
    transcript: () => [
      { role: "agent", text: `Thanks for calling ${A}, this is ${AVA}. How can I help?` },
      { role: "caller", text: "What are your hours and how much is a session?" },
      { role: "agent", text: "We're open weekdays 9 to 5. Single sessions and monthly packages are available — would you like me to text you the details?" },
      { role: "caller", text: "Yes, please text me." },
      { role: "agent", text: "Done — it's on the way. Anything else I can help with?" },
      { role: "caller", text: "No, that's all. Thanks." },
    ],
  },
  {
    sentiment: "POSITIVE",
    duration: [90, 200],
    summary: (n) =>
      `${n} called to reschedule an upcoming appointment. ${AVA} moved it to a later slot and confirmed the change.`,
    transcript: (n) => [
      { role: "agent", text: `${A}, this is ${AVA}. How can I help?` },
      { role: "caller", text: "I need to move my appointment to Friday." },
      { role: "agent", text: `No problem, ${n.split(" ")[0]}. I have Friday at 2 PM open — shall I move you there?` },
      { role: "caller", text: "Friday at 2 is great." },
      { role: "agent", text: "All set — you'll get an updated confirmation. Thanks!" },
    ],
  },
  {
    sentiment: "NEUTRAL",
    duration: [60, 160],
    summary: (n) =>
      `${n} requested to speak with a team member about an account question. ${AVA} took a message and let them know someone would follow up.`,
    transcript: () => [
      { role: "agent", text: `Thanks for calling ${A}, this is ${AVA}.` },
      { role: "caller", text: "Can I talk to someone about my account?" },
      { role: "agent", text: "Of course — our team can reach out. What's the best number and time to call you back?" },
      { role: "caller", text: "This number, anytime after noon." },
      { role: "agent", text: "Got it. Someone will follow up this afternoon. Thanks!" },
    ],
  },
  {
    sentiment: "NEGATIVE",
    duration: [70, 180],
    summary: (n) =>
      `${n} was frustrated about a scheduling mix-up. ${AVA} apologized, noted the details, and escalated the issue to the team for a callback.`,
    transcript: (n) => [
      { role: "agent", text: `${A}, this is ${AVA}. How can I help?` },
      { role: "caller", text: "My appointment wasn't in the system when I showed up." },
      { role: "agent", text: `I'm really sorry about that, ${n.split(" ")[0]}. I'll flag this for the team right away so we can make it right.` },
      { role: "caller", text: "Please do, that was frustrating." },
      { role: "agent", text: "Understood — someone will call you back shortly to sort it out. Thank you for your patience." },
    ],
  },
  {
    sentiment: "NEUTRAL",
    duration: [30, 90],
    summary: (n) =>
      `${n} called after hours. ${AVA} shared the next available opening and offered to text a booking link.`,
    transcript: () => [
      { role: "agent", text: `You've reached ${A}. This is ${AVA} — how can I help?` },
      { role: "caller", text: "Are you open right now?" },
      { role: "agent", text: "We're closed for the evening, but I can text you a link to book online. Would that help?" },
      { role: "caller", text: "Sure, text me the link." },
      { role: "agent", text: "Sent! Have a good night." },
    ],
  },
];

const NO_CONVO = {
  sentiment: "NEUTRAL" as const,
  summary: () => "No conversation recorded",
  duration: [0, 0] as [number, number],
};

function two(n: number): string {
  return String(n).padStart(2, "0");
}

// date `d` days before ANCHOR, at a given hour, as ISO (UTC).
function isoDaysBefore(days: number, hour: number, minute: number): string {
  const base = new Date(`${ANCHOR}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  base.setUTCHours(hour, minute, int(0, 59), 0);
  return base.toISOString();
}

// --- calls (40 sample records within the last 30 days) -------------------------
const calls = Array.from({ length: 40 }, (_, i) => {
  const id = `c${two(i + 1)}${two(int(0, 99))}`;
  const first = pick(FIRST);
  const name = `${first} ${pick(LAST_INITIAL)}`;
  const daysAgo = int(0, 29);
  const hour = int(7, 20);
  const afterHours = hour < 9 || hour >= 17;
  const isNoConvo = rnd() < 0.12; // ~1 in 8 is a no-answer/voicemail
  const unknown = rnd() < 0.15;

  if (isNoConvo) {
    return {
      id,
      direction: "inbound" as const,
      status: "COMPLETED",
      answered: false,
      afterHours,
      contactName: unknown ? "Unknown caller" : name,
      contactPhoneMasked: `+1 ••• ••• ${two(int(0, 99))}${two(int(0, 99))}`,
      durationSeconds: int(4, 20),
      sentiment: NO_CONVO.sentiment,
      summary: NO_CONVO.summary(),
      startedAt: isoDaysBefore(daysAgo, hour, int(0, 59)),
      assistantName: AVA,
      hasRecording: false,
      transcript: [] as Turn[],
    };
  }

  // Cycle scenarios (offset by a random start) so all types appear evenly
  // instead of the same one clustering.
  const s = SCENARIOS[(i + 2) % SCENARIOS.length]!;
  const fullName = unknown ? "Unknown caller" : name;
  const summaryName = unknown ? "A caller" : name;
  return {
    id,
    direction: rnd() < 0.85 ? ("inbound" as const) : ("outbound" as const),
    status: "COMPLETED",
    answered: true,
    afterHours,
    contactName: fullName,
    contactPhoneMasked: `+1 ••• ••• ${two(int(0, 99))}${two(int(0, 99))}`,
    durationSeconds: int(s.duration[0], s.duration[1]),
    sentiment: s.sentiment,
    summary: s.summary(summaryName),
    startedAt: isoDaysBefore(daysAgo, hour, int(0, 59)),
    assistantName: AVA,
    hasRecording: true,
    transcript: s.transcript(fullName),
  };
}).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

// --- daily trend (90 days) + windowed aggregate stats --------------------------
const dailyTrend90 = Array.from({ length: 90 }, (_, i) => {
  const days = 89 - i; // oldest first
  const base = new Date(`${ANCHOR}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  const dow = base.getUTCDay();
  const weekend = dow === 0 || dow === 6;
  const callsCount = weekend ? int(2, 8) : int(9, 24);
  const answered = Math.max(0, callsCount - int(0, 3));
  return { date: base.toISOString().slice(0, 10), calls: callsCount, answered };
});

function windowStats(days: number) {
  const slice = dailyTrend90.slice(90 - days);
  const totalCalls = slice.reduce((s, d) => s + d.calls, 0);
  const answered = slice.reduce((s, d) => s + d.answered, 0);
  const completedCalls = answered;
  const errorCalls = Math.round(totalCalls * 0.02);
  const avgDurationSeconds = int(48, 72);
  const totalDurationMinutes = Math.round((completedCalls * avgDurationSeconds) / 60);
  const negative = Math.round(completedCalls * 0.06);
  const positive = Math.round(completedCalls * 0.18);
  const neutral = completedCalls - negative - positive;
  return {
    totalCalls,
    completedCalls,
    errorCalls,
    totalDurationMinutes,
    avgDurationSeconds,
    sentimentBreakdown: { positive, neutral, negative },
  };
}

const ranges = {
  "7": { days: 7, stats: windowStats(7) },
  "30": { days: 30, stats: windowStats(30) },
  "60": { days: 60, stats: windowStats(60) },
  "90": { days: 90, stats: windowStats(90) },
};

const stats = ranges["30"].stats;
const conversationStats = {
  total: Math.round(stats.totalCalls * 0.8),
  active: Math.round(stats.totalCalls * 0.8),
  totalMessages: stats.completedCalls * int(5, 8),
  aiMessages: stats.completedCalls * int(2, 4),
};

const snapshot = {
  generatedAt: ANCHOR,
  client: CLIENT,
  rangeDays: 30,
  stats,
  conversationStats,
  dailyTrend: dailyTrend90.slice(-14),
  calls,
  ranges,
  dailyTrend90,
};

writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  `Wrote ${calls.length} synthetic calls + 90-day trend for ${CLIENT.name} → src/data/demo-snapshot.json`,
);
