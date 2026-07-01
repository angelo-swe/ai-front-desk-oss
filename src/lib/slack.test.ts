import { describe, expect, test } from "bun:test";
import {
  isValidSlackChannelId,
  mergeSlackChannel,
  parseSlackMap,
} from "./slack";

describe("isValidSlackChannelId", () => {
  test("accepts real-shaped channel/group ids", () => {
    expect(isValidSlackChannelId("C0ABC123XYZ")).toBe(true);
    expect(isValidSlackChannelId("C0DEF456GHI")).toBe(true);
    expect(isValidSlackChannelId("G0JKL789MNO")).toBe(true);
  });
  test("rejects junk, lowercase, wrong prefix, too short", () => {
    expect(isValidSlackChannelId("")).toBe(false);
    expect(isValidSlackChannelId("hello")).toBe(false);
    expect(isValidSlackChannelId("c0abc123xyz")).toBe(false); // lowercase
    expect(isValidSlackChannelId("X0ABC123XYZ")).toBe(false); // bad prefix
    expect(isValidSlackChannelId("C123")).toBe(false); // too short
    expect(isValidSlackChannelId("C0ABC123!YZ")).toBe(false); // symbol
  });
});

describe("parseSlackMap", () => {
  test("keeps valid entries, drops invalid ones", () => {
    const raw = JSON.stringify({
      acme: "C0ABC123XYZ",
      bad: "not-an-id",
      northside: "C0DEF456GHI",
    });
    expect(parseSlackMap(raw)).toEqual({
      acme: "C0ABC123XYZ",
      northside: "C0DEF456GHI",
    });
  });
  test("empty/invalid input yields an empty map", () => {
    expect(parseSlackMap(null)).toEqual({});
    expect(parseSlackMap(undefined)).toEqual({});
    expect(parseSlackMap("not json")).toEqual({});
    expect(parseSlackMap("[1,2,3]")).toEqual({});
  });
});

describe("mergeSlackChannel", () => {
  test("adds a tenant while preserving others", () => {
    const raw = JSON.stringify({ acme: "C0ABC123XYZ" });
    const next = mergeSlackChannel(raw, "northside", "C0DEF456GHI");
    expect(JSON.parse(next)).toEqual({
      acme: "C0ABC123XYZ",
      northside: "C0DEF456GHI",
    });
  });
  test("clears a tenant when channelId is null/empty", () => {
    const raw = JSON.stringify({ acme: "C0ABC123XYZ", riverside: "C0JKL789MNO" });
    expect(JSON.parse(mergeSlackChannel(raw, "acme", null))).toEqual({
      riverside: "C0JKL789MNO",
    });
  });
});
