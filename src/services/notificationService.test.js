import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  buildNotificationDocId,
  isFirestoreIndexError,
  mergeNotificationsById,
  sanitizeNotificationPatch,
  sanitizeNotificationSettings,
} from "./notificationService";

describe("notificationService", () => {
  it("fills missing notification settings with defaults", () => {
    expect(sanitizeNotificationSettings(null)).toEqual({
      ...DEFAULT_NOTIFICATION_SETTINGS,
    });

    expect(
      sanitizeNotificationSettings({
        budget80Enabled: false,
      })
    ).toEqual({
      budget80Enabled: false,
      budget100Enabled: true,
      dailyReminderEnabled: false,
    });
  });

  it("keeps only boolean values in notification patches", () => {
    expect(
      sanitizeNotificationPatch({
        budget80Enabled: false,
        budget100Enabled: "yes",
        dailyReminderEnabled: true,
      })
    ).toEqual({
      budget80Enabled: false,
      dailyReminderEnabled: true,
    });
  });

  it("builds sanitized notification ids", () => {
    expect(buildNotificationDocId("user@1", "budget/exceeded:food")).toBe(
      "user_1_budget_exceeded_food"
    );
  });

  it("detects missing composite indexes from firestore errors", () => {
    expect(
      isFirestoreIndexError({
        code: "failed-precondition",
      })
    ).toBe(true);

    expect(
      isFirestoreIndexError({
        message: "The query requires an index.",
      })
    ).toBe(true);

    expect(
      isFirestoreIndexError({
        code: "permission-denied",
        message: "Missing or insufficient permissions.",
      })
    ).toBe(false);
  });

  it("merges notifications by id and preserves newest-first order", () => {
    const items = mergeNotificationsById(
      [
        { id: "a", createdAt: "2026-06-18T08:00:00.000Z" },
        { id: "b", createdAt: "2026-06-19T08:00:00.000Z" },
      ],
      [
        { id: "a", createdAt: "2026-06-20T08:00:00.000Z" },
        { id: "c", createdAt: "2026-06-17T08:00:00.000Z" },
      ]
    );

    expect(items.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });
});
