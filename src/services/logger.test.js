import { describe, expect, it, vi } from "vitest";
import { createLogEntry, logError, serializeError } from "./logger";

describe("logger", () => {
  it("serializes plain errors consistently", () => {
    const error = new Error("boom");
    error.code = "test/code";

    expect(serializeError(error)).toMatchObject({
      name: "Error",
      message: "boom",
      code: "test/code",
    });
  });

  it("creates structured entries", () => {
    const entry = createLogEntry("info", "hello", { feature: "auth" });

    expect(entry).toMatchObject({
      level: "info",
      message: "hello",
      meta: { feature: "auth" },
    });
    expect(entry.timestamp).toBeTypeOf("string");
  });

  it("logs errors with serialized payload", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const entry = logError("test failure", new Error("nope"), { source: "unit-test" });

    expect(entry.level).toBe("error");
    expect(entry.meta.source).toBe("unit-test");
    expect(entry.meta.error.message).toBe("nope");

    errorSpy.mockRestore();
  });
});
