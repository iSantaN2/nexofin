import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useNotifications() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useNotifications debe usarse dentro de AppProvider");
  }

  return {
    notifications: context.notifications,
    notificationsError: context.notificationsError,
    notificationsLoading: context.notificationsLoading,
    loadingMoreNotifications: context.loadingMoreNotifications,
    hasMoreNotifications: context.hasMoreNotifications,
    unreadNotificationsCount: context.unreadNotificationsCount,
    markNotificationRead: context.markNotificationRead,
    markAllNotificationsRead: context.markAllNotificationsRead,
    resolveNotification: context.resolveNotification,
    deleteNotification: context.deleteNotification,
    loadMoreNotifications: context.loadMoreNotifications,
  };
}
