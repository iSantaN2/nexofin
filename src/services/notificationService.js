export const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  budget80Enabled: true,
  budget100Enabled: true,
  dailyReminderEnabled: false,
});

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const sanitizeNotificationSettings = (rawValue) => {
  if (!rawValue || typeof rawValue !== "object") {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  return {
    budget80Enabled:
      typeof rawValue.budget80Enabled === "boolean"
        ? rawValue.budget80Enabled
        : DEFAULT_NOTIFICATION_SETTINGS.budget80Enabled,
    budget100Enabled:
      typeof rawValue.budget100Enabled === "boolean"
        ? rawValue.budget100Enabled
        : DEFAULT_NOTIFICATION_SETTINGS.budget100Enabled,
    dailyReminderEnabled:
      typeof rawValue.dailyReminderEnabled === "boolean"
        ? rawValue.dailyReminderEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.dailyReminderEnabled,
  };
};

export const sanitizeNotificationPatch = (rawValue) => {
  if (!rawValue || typeof rawValue !== "object") return {};
  const patch = {};

  if (typeof rawValue.budget80Enabled === "boolean") {
    patch.budget80Enabled = rawValue.budget80Enabled;
  }
  if (typeof rawValue.budget100Enabled === "boolean") {
    patch.budget100Enabled = rawValue.budget100Enabled;
  }
  if (typeof rawValue.dailyReminderEnabled === "boolean") {
    patch.dailyReminderEnabled = rawValue.dailyReminderEnabled;
  }

  return patch;
};

export const normalizeNotificationSeverity = (value) => {
  return ["info", "success", "warning", "danger"].includes(value) ? value : "info";
};

export const normalizeNotificationStatus = (value) => {
  return ["new", "read", "resolved"].includes(value) ? value : "new";
};

export const normalizeNotificationText = (value, maxLength, fallback = "") => {
  const cleanValue = typeof value === "string" ? value.trim() : "";
  if (!cleanValue) return fallback;
  return cleanValue.slice(0, maxLength);
};

export const buildNotificationDocId = (uid, sourceKey) => {
  const rawId = `${uid}_${sourceKey}`;
  return rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
};

export const mapNotificationDoc = (docItem) => ({
  id: docItem.id,
  ...docItem.data(),
});

export const isFirestoreIndexError = (error) => {
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return error?.code === "failed-precondition" || message.includes("index");
};

export const sortNotificationsByCreatedAt = (items) =>
  [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

export const mergeNotificationsById = (...lists) => {
  const merged = new Map();

  lists.flat().forEach((item) => {
    if (item?.id && !merged.has(item.id)) {
      merged.set(item.id, item);
    }
  });

  return sortNotificationsByCreatedAt([...merged.values()]);
};
