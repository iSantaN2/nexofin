import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { isAccountDeletionInProgress } from "../utils/accountDeletion";
import { deleteBudgetDoc, upsertBudgetDoc } from "../services/budgetService";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATIONS_PAGE_SIZE,
  buildNotificationDocId,
  isFirestoreIndexError,
  mapNotificationDoc,
  mergeNotificationsById,
  normalizeNotificationSeverity,
  normalizeNotificationStatus,
  normalizeNotificationText,
  sanitizeNotificationPatch,
  sanitizeNotificationSettings,
  sortNotificationsByCreatedAt,
} from "../services/notificationService";
import { logError } from "../services/logger";

export const AppContext = createContext();

const getNotificationsFallbackPage = (items, cursor = null, pageSize = NOTIFICATIONS_PAGE_SIZE) => {
  const currentOffset =
    typeof cursor === "object" && cursor !== null && "offset" in cursor ? cursor.offset : 0;
  const pageItems = items.slice(currentOffset, currentOffset + pageSize);
  const nextOffset = currentOffset + pageItems.length;

  return {
    items: pageItems,
    cursor: nextOffset < items.length ? { offset: nextOffset } : null,
    hasMore: nextOffset < items.length,
  };
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [budgetsError, setBudgetsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const notificationCursorRef = useRef(null);
  const notificationHistoryRef = useRef([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
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
        if (isAccountDeletionInProgress(user.uid)) {
          setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS });
          return;
        }

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
          logError("Error al crear preferencias de notificaciones", error, {
            source: "notifications.settings-create",
          });
        }
      },
      (error) => {
        logError("Error al cargar preferencias de notificaciones", error, {
          source: "notifications.settings-load",
        });
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setNotificationsError("");
      notificationCursorRef.current = null;
      notificationHistoryRef.current = [];
      setHasMoreNotifications(false);
      setNotificationsLoading(false);
      return undefined;
    }

    setNotificationsLoading(true);
    setNotificationsError("");
    notificationCursorRef.current = null;
    notificationHistoryRef.current = [];
    setHasMoreNotifications(false);

    const orderedNotificationsQuery = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limitQuery(NOTIFICATIONS_PAGE_SIZE + 1)
    );
    const fallbackNotificationsQuery = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid)
    );

    let unsubscribe = () => {};

    const subscribeWithFallback = () =>
      onSnapshot(
        fallbackNotificationsQuery,
        (snapshot) => {
          const sortedItems = sortNotificationsByCreatedAt(
            snapshot.docs.map(mapNotificationDoc)
          );
          const { items, cursor, hasMore } = getNotificationsFallbackPage(sortedItems);

          if (notificationHistoryRef.current.length === 0) {
            notificationCursorRef.current = cursor;
            setHasMoreNotifications(hasMore);
          }

          setNotifications(mergeNotificationsById(items, notificationHistoryRef.current));
          setNotificationsError("");
          setNotificationsLoading(false);
        },
        (error) => {
          logError("Error al cargar notificaciones", error, {
            source: "notifications.listener-fallback",
          });
          setNotificationsError("No se pudieron cargar las alertas. Revisa tu conexion e intenta nuevamente.");
          setNotificationsLoading(false);
        }
      );

    unsubscribe = onSnapshot(
      orderedNotificationsQuery,
      (snapshot) => {
        const pageDocs = snapshot.docs.slice(0, NOTIFICATIONS_PAGE_SIZE);
        const data = pageDocs.map(mapNotificationDoc);

        if (notificationHistoryRef.current.length === 0) {
          notificationCursorRef.current = pageDocs.at(-1) || null;
          setHasMoreNotifications(snapshot.docs.length > NOTIFICATIONS_PAGE_SIZE);
        }

        setNotifications(mergeNotificationsById(data, notificationHistoryRef.current));
        setNotificationsError("");
        setNotificationsLoading(false);
      },
      (error) => {
        if (isFirestoreIndexError(error)) {
          unsubscribe();
          unsubscribe = subscribeWithFallback();
          return;
        }

        logError("Error al cargar notificaciones", error, {
          source: "notifications.listener",
        });
        setNotificationsError("No se pudieron cargar las alertas. Revisa tu conexion e intenta nuevamente.");
        setNotificationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const loadMoreNotifications = useCallback(async () => {
    if (!user?.uid || !notificationCursorRef.current || loadingMoreNotifications) {
      return false;
    }

    setLoadingMoreNotifications(true);

    try {
      const queryConstraints = [
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limitQuery(NOTIFICATIONS_PAGE_SIZE + 1),
      ];

      if (
        notificationCursorRef.current &&
        !(typeof notificationCursorRef.current === "object" &&
          notificationCursorRef.current !== null &&
          "offset" in notificationCursorRef.current)
      ) {
        queryConstraints.splice(2, 0, startAfter(notificationCursorRef.current));
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, "notifications"), ...queryConstraints)
        );
        const pageDocs = snapshot.docs.slice(0, NOTIFICATIONS_PAGE_SIZE);
        const data = pageDocs.map(mapNotificationDoc);

        if (pageDocs.length > 0) {
          notificationCursorRef.current = pageDocs.at(-1);
        }

        notificationHistoryRef.current = mergeNotificationsById(
          notificationHistoryRef.current,
          data
        );

        setNotifications((previous) =>
          mergeNotificationsById(previous, notificationHistoryRef.current)
        );
        setHasMoreNotifications(snapshot.docs.length > NOTIFICATIONS_PAGE_SIZE);
      } catch (error) {
        if (!isFirestoreIndexError(error)) {
          throw error;
        }

        const fallbackSnapshot = await getDocs(
          query(collection(db, "notifications"), where("uid", "==", user.uid))
        );
        const sortedItems = sortNotificationsByCreatedAt(
          fallbackSnapshot.docs.map(mapNotificationDoc)
        );
        const fallbackPage = getNotificationsFallbackPage(
          sortedItems,
          notificationCursorRef.current
        );

        notificationCursorRef.current = fallbackPage.cursor;
        notificationHistoryRef.current = mergeNotificationsById(
          notificationHistoryRef.current,
          fallbackPage.items
        );

        setNotifications((previous) =>
          mergeNotificationsById(previous, notificationHistoryRef.current)
        );
        setHasMoreNotifications(fallbackPage.hasMore);
      }

      return true;
    } catch (error) {
      logError("Error al cargar mas notificaciones", error, {
        source: "notifications.load-more",
      });
      return false;
    } finally {
      setLoadingMoreNotifications(false);
    }
  }, [loadingMoreNotifications, user?.uid]);

  const updateNotificationSettings = useCallback(async (partialSettings) => {
    if (!user?.uid) return false;

    const normalizedPatch = sanitizeNotificationPatch(partialSettings);
    if (Object.keys(normalizedPatch).length === 0) return false;

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
      return true;
    } catch (error) {
      logError("Error al guardar preferencias de notificaciones", error, {
        source: "notifications.settings-save",
      });
      setNotificationSettings(notificationSettings);
      localStorage.setItem(storageKey, JSON.stringify(notificationSettings));
      return false;
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
    const shouldReactivate = rawNotification.reactivate === true;
    const now = new Date().toISOString();

    try {
      if (sourceKey) {
        const notificationId = buildNotificationDocId(user.uid, sourceKey);
        const existingNotification = notificationsRef.current.find(
          (item) => item.id === notificationId || item.sourceKey === sourceKey
        );

        if (existingNotification?.status === "resolved" && !shouldReactivate) {
          return existingNotification.id;
        }

        const notificationRef = doc(db, "notifications", notificationId);
        const updatePayload = {
          type,
          title,
          message,
          severity,
          recommendation,
          actionPath,
          sourceKey,
          monthKey,
          updatedAt: now,
        };

        if (shouldReactivate) {
          updatePayload.read = false;
          updatePayload.status = status;
          updatePayload.resolvedAt = null;
        }

        try {
          await updateDoc(notificationRef, updatePayload);
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
      logError("Error al crear notificacion", error, { source: "notifications.create" });
      return null;
    }
  }, [user?.uid]);

  const markNotificationRead = useCallback(async (id) => {
    if (!user?.uid || !id) return false;

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        status: "read",
        updatedAt: new Date().toISOString(),
      });
      notificationHistoryRef.current = notificationHistoryRef.current.map((item) =>
        item.id === id ? { ...item, read: true, status: "read", updatedAt: new Date().toISOString() } : item
      );
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, read: true, status: "read", updatedAt: new Date().toISOString() } : item
        )
      );
      return true;
    } catch (error) {
      logError("Error al marcar notificacion", error, {
        source: "notifications.mark-read",
      });
      return false;
    }
  }, [user?.uid]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user?.uid) return false;

    const unreadItems = notifications.filter((item) => !item.read && item.status !== "resolved");
    const results = await Promise.all(unreadItems.map((item) => markNotificationRead(item.id)));
    return results.every(Boolean);
  }, [markNotificationRead, notifications, user?.uid]);

  const resolveNotification = useCallback(async (id) => {
    if (!user?.uid || !id) return false;

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        status: "resolved",
        resolvedAt: now,
        updatedAt: now,
      });
      notificationHistoryRef.current = notificationHistoryRef.current.map((item) =>
        item.id === id
          ? { ...item, read: true, status: "resolved", resolvedAt: now, updatedAt: now }
          : item
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
      logError("Error al resolver notificacion", error, {
        source: "notifications.resolve",
      });
      return false;
    }
  }, [user?.uid]);

  const deleteNotification = useCallback(async (id) => {
    if (!user?.uid || !id) return false;

    try {
      await deleteDoc(doc(db, "notifications", id));
      notificationHistoryRef.current = notificationHistoryRef.current.filter(
        (item) => item.id !== id
      );
      setNotifications((previous) => previous.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      logError("Error al eliminar notificacion", error, {
        source: "notifications.delete",
      });
      return false;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setBudgets([]);
      setBudgetsError("");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setBudgetsError("");
    const q = query(collection(db, "budgets"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        setBudgets(data);
        setBudgetsError("");
        setLoading(false);
      },
      (error) => {
        logError("Error al cargar presupuestos", error, { source: "budgets.listener" });
        setBudgetsError("No se pudieron cargar las metas. Revisa tu conexion e intenta nuevamente.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const upsertBudget = useCallback(
    async ({ category, monthKey, limitAmount }) => {
      return upsertBudgetDoc({
        uid: user?.uid,
        budgets,
        category,
        monthKey,
        limitAmount,
      });
    },
    [budgets, user?.uid]
  );

  const deleteBudget = useCallback(
    async (id) => {
      return deleteBudgetDoc({ uid: user?.uid, id });
    },
    [user?.uid]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.read && item.status !== "resolved").length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      budgets,
      budgetsError,
      loading,
      notifications,
      notificationsError,
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
    }),
    [
      budgets,
      budgetsError,
      loading,
      notifications,
      notificationsError,
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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

