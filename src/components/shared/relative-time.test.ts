import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRelativeTime } from "./relative-time";

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Just now' for times less than a minute ago", () => {
    const date = new Date("2026-02-05T11:59:30Z").toISOString();
    expect(getRelativeTime(date)).toBe("Just now");
  });

  it("returns minutes ago for times less than an hour", () => {
    const date = new Date("2026-02-05T11:45:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("15m ago");
  });

  it("returns hours ago for times less than a day", () => {
    const date = new Date("2026-02-05T09:00:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("3h ago");
  });

  it("returns days ago for times more than a day", () => {
    const date = new Date("2026-02-03T12:00:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("2d ago");
  });
});
