import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { isValidMonthKey, normalizePositiveAmount, normalizeText } from "../utils/validation";

export const AppContext = createContext();

const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  budget80Enabled: true,
  budget100Enabled: true,
  dailyReminderEnabled: false,
});

const NOTIFICATIONS_PAGE_SIZE = 40;

const sanitizeNotificationSettings = (rawValue) => {
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

const sanitizeNotificationPatch = (rawValue) => {
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

const normalizeNotificationSeverity = (value) => {
  return ["info", "success", "warning", "danger"].includes(value) ? value : "info";
};

const normalizeNotificationStatus = (value) => {
  return ["new", "read", "resolved"].includes(value) ? value : "new";
};

const normalizeNotificationText = (value, maxLength, fallback = "") => {
  const cleanValue = typeof value === "string" ? value.trim() : "";
  if (!cleanValue) return fallback;
  return cleanValue.slice(0, maxLength);
};

const buildNotificationDocId = (uid, sourceKey) => {
  const rawId = `${uid}_${sourceKey}`;
  return rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const olderNotificationsRef = useRef([]);
  const lastNotificationDocRef = useRef(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    ...DEFAULT_NOTIFICATION_SETTINGS,
  });

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (!user?.uid) {
      setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS });
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    const storageKey = `nexofin_notification_settings_${user.uid}`;
    let localSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };

    try {
      const rawValue = localStorage.getItem(storageKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : null;
      localSettings = sanitizeNotificationSettings(parsedValue);
    } catch {
      localSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    setNotificationSettings(localSettings);

    const settingsRef = doc(db, "notificationSettings", user.uid);
    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const nextSettings = sanitizeNotificationSettings(snapshot.data());
          setNotificationSettings(nextSettings);
          localStorage.setItem(storageKey, JSON.stringify(nextSettings));
          return;
        }

        try {
          await setDoc(settingsRef, {
            uid: user.uid,
            ...localSettings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error al crear preferencias de notificaciones:", error);
        }
      },
      (error) => {
        console.error("Error al cargar preferencias de notificaciones:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setNotificationsLoading(false);
      setLoadingMoreNotifications(false);
      setHasMoreNotifications(false);
      olderNotificationsRef.current = [];
      lastNotificationDocRef.current = null;
      return undefined;
    }

    setNotificationsLoading(true);
    olderNotificationsRef.current = [];
    lastNotificationDocRef.current = null;
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(NOTIFICATIONS_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        lastNotificationDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMoreNotifications(snapshot.docs.length === NOTIFICATIONS_PAGE_SIZE);

        const realtimeData = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }));
        const realtimeIds = new Set(realtimeData.map((item) => item.id));
        const preservedOlder = olderNotificationsRef.current.filter(
          (item) => !realtimeIds.has(item.id)
        );
        const data = [...realtimeData, ...preservedOlder].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setNotifications(data);
        setNotificationsLoading(false);
      },
      (error) => {
        console.error("Error al cargar notificaciones:", error);
        setNotificationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const loadMoreNotifications = useCallback(async () => {
    if (!user?.uid || loadingMoreNotifications || !lastNotificationDocRef.current) return;

    setLoadingMoreNotifications(true);
    try {
      const nextQuery = query(
        collection(db, "notifications"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastNotificationDocRef.current),
        limit(NOTIFICATIONS_PAGE_SIZE)
      );
      const snapshot = await getDocs(nextQuery);
      lastNotificationDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setHasMoreNotifications(snapshot.docs.length === NOTIFICATIONS_PAGE_SIZE);

      const newItems = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      const existingIds = new Set(notificationsRef.current.map((item) => item.id));
      const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
      olderNotificationsRef.current = [...olderNotificationsRef.current, ...uniqueNewItems];

      setNotifications((previous) => {
        const previousIds = new Set(previous.map((item) => item.id));
        return [...previous, ...uniqueNewItems.filter((item) => !previousIds.has(item.id))].sort(
          (a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          }
        );
      });
    } catch (error) {
      console.error("Error al cargar mas notificaciones:", error);
    } finally {
      setLoadingMoreNotifications(false);
    }
  }, [loadingMoreNotifications, user?.uid]);

  const updateNotificationSettings = useCallback(async (partialSettings) => {
    if (!user?.uid) return;

    const normalizedPatch = sanitizeNotificationPatch(partialSettings);
    if (Object.keys(normalizedPatch).length === 0) return;

    const now = new Date().toISOString();
    const storageKey = `nexofin_notification_settings_${user.uid}`;

    const nextValue = { ...notificationSettings, ...normalizedPatch };
    setNotificationSettings(nextValue);
    localStorage.setItem(storageKey, JSON.stringify(nextValue));

    try {
      await setDoc(
        doc(db, "notificationSettings", user.uid),
        {
          uid: user.uid,
          ...nextValue,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error al guardar preferencias de notificaciones:", error);
    }
  }, [notificationSettings, user?.uid]);

  const createNotification = useCallback(async (rawNotification) => {
    if (!user?.uid || !rawNotification) return null;

    const title = normalizeNotificationText(rawNotification.title, 120, "Alerta financiera");
    const message = normalizeNotificationText(rawNotification.message, 500, "Revisa tu actividad financiera.");
    const type = normalizeNotificationText(rawNotification.type, 50, "general");
    const severity = normalizeNotificationSeverity(rawNotification.severity);
    const status = normalizeNotificationStatus(rawNotification.status);
    const sourceKey = normalizeNotificationText(rawNotification.sourceKey, 120, "");
    const monthKey = normalizeNotificationText(rawNotification.monthKey, 20, "");
    const recommendation = normalizeNotificationText(rawNotification.recommendation, 500, "");
    const actionPath = normalizeNotificationText(rawNotification.actionPath, 160, "");
    const now = new Date().toISOString();

    try {
      if (sourceKey) {
        const notificationId = buildNotificationDocId(user.uid, sourceKey);
        const existingNotification = notificationsRef.current.find(
          (item) => item.id === notificationId || item.sourceKey === sourceKey
        );

        if (existingNotification?.status === "resolved") {
          return existingNotification.id;
        }

        const notificationRef = doc(db, "notifications", notificationId);
        try {
          await updateDoc(notificationRef, {
            type,
            title,
            message,
            severity,
            recommendation,
            actionPath,
            sourceKey,
            monthKey,
            updatedAt: now,
          });
        } catch {
          await setDoc(notificationRef, {
            uid: user.uid,
            type,
            title,
            message,
            severity,
            recommendation,
            actionPath,
            sourceKey,
            monthKey,
            read: false,
            status,
            createdAt: now,
            updatedAt: now,
          });
        }

        return notificationRef.id;
      }

      const docRef = await addDoc(collection(db, "notifications"), {
        uid: user.uid,
        type,
        title,
        message,
        severity,
        recommendation,
        actionPath,
        sourceKey: "",
        monthKey,
        read: false,
        status,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error("Error al crear notificacion:", error);
      return null;
    }
  }, [user?.uid]);

  const markNotificationRead = useCallback(async (id) => {
    if (!user?.uid || !id) return;

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        status: "read",
        updatedAt: new Date().toISOString(),
      });
      olderNotificationsRef.current = olderNotificationsRef.current.map((item) =>
        item.id === id ? { ...item, read: true, status: "read", updatedAt: new Date().toISOString() } : item
      );
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, read: true, status: "read", updatedAt: new Date().toISOString() } : item
        )
      );
      return true;
    } catch (error) {
      console.error("Error al marcar notificacion:", error);
      return false;
    }
  }, [user?.uid]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user?.uid) return;

    const unreadItems = notifications.filter((item) => !item.read && item.status !== "resolved");
    await Promise.all(unreadItems.map((item) => markNotificationRead(item.id)));
  }, [markNotificationRead, notifications, user?.uid]);

  const resolveNotification = useCallback(async (id) => {
    if (!user?.uid || !id) return;

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        status: "resolved",
        resolvedAt: now,
        updatedAt: now,
      });
      olderNotificationsRef.current = olderNotificationsRef.current.map((item) =>
        item.id === id ? { ...item, read: true, status: "resolved", resolvedAt: now, updatedAt: now } : item
      );
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, read: true, status: "resolved", resolvedAt: now, updatedAt: now }
            : item
        )
      );
      return true;
    } catch (error) {
      console.error("Error al resolver notificacion:", error);
      return false;
    }
  }, [user?.uid]);

  const deleteNotification = useCallback(async (id) => {
    if (!user?.uid || !id) return;

    try {
      await deleteDoc(doc(db, "notifications", id));
      olderNotificationsRef.current = olderNotificationsRef.current.filter((item) => item.id !== id);
      setNotifications((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar notificacion:", error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setBudgets([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const q = query(collection(db, "budgets"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        setBudgets(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar presupuestos:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const upsertBudget = async ({ category, monthKey, limitAmount }) => {
    if (!user?.uid) return null;

    const normalizedCategory = normalizeText(category, 80);
    const normalizedMonth = (monthKey || "").trim();
    const amount = normalizePositiveAmount(limitAmount);

    if (!normalizedCategory || !isValidMonthKey(normalizedMonth) || amount <= 0) return null;

    const existing = budgets.find(
      (item) => item.category === normalizedCategory && item.monthKey === normalizedMonth
    );

    if (existing?.id) {
      await updateDoc(doc(db, "budgets", existing.id), {
        limitAmount: amount,
        updatedAt: new Date().toISOString(),
      });
      return existing.id;
    }

    const docRef = await addDoc(collection(db, "budgets"), {
      uid: user.uid,
      category: normalizedCategory,
      monthKey: normalizedMonth,
      limitAmount: amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return docRef.id;
  };

  const deleteBudget = async (id) => {
    if (!user?.uid || !id) return;
    await deleteDoc(doc(db, "budgets", id));
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.read && item.status !== "resolved").length,
    [notifications]
  );

  const value = {
    budgets,
    loading,
    notifications,
    notificationsLoading,
    loadingMoreNotifications,
    hasMoreNotifications,
    unreadNotificationsCount,
    notificationSettings,
    upsertBudget,
    deleteBudget,
    updateNotificationSettings,
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    resolveNotification,
    deleteNotification,
    loadMoreNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

