import { describe, expect, test } from "bun:test";
import { cleanTranscript } from "./transcript";

describe("cleanTranscript", () => {
  test("maps agent + user roles to agent/caller", () => {
    expect(
      cleanTranscript([
        { role: "assistant", content: "Hi, how can I help?" },
        { role: "user", content: "I'd like to book an appointment." },
      ]),
    ).toEqual([
      { role: "agent", text: "Hi, how can I help?" },
      { role: "caller", text: "I'd like to book an appointment." },
    ]);
  });

  test("drops tool/function/system turns by role", () => {
    expect(
      cleanTranscript([
        { role: "agent", content: "One moment." },
        { role: "tool", content: '{"return":{"ok":true}}' },
        { role: "function", content: "irrelevant" },
        { role: "system", content: "You are a receptionist." },
      ]),
    ).toEqual([{ role: "agent", text: "One moment." }]);
  });

  test("drops JSON tool payloads even under a speaking role", () => {
    // The bug in the wild: a tool result attributed to the caller role.
    expect(
      cleanTranscript([
        { role: "user", content: '{"return":{"inputs":{"city":"Glendale"}},"ok":true}' },
        { role: "user", content: "Thanks!" },
      ]),
    ).toEqual([{ role: "caller", text: "Thanks!" }]);
  });

  test("trims whitespace and drops empty turns", () => {
    expect(
      cleanTranscript([
        { role: "agent", content: "  Hello there  " },
        { role: "user", content: "   " },
        { role: "user", content: null },
      ]),
    ).toEqual([{ role: "agent", text: "Hello there" }]);
  });

  test("unknown speaking roles fall back to caller (never dropped)", () => {
    expect(
      cleanTranscript([{ role: "human", content: "Yes please." }]),
    ).toEqual([{ role: "caller", text: "Yes please." }]);
  });
});
