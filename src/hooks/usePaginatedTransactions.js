import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logError } from "../services/logger";
import { getTransactionPage } from "../services/transactionService";

export function usePaginatedTransactions({ enabled = true, refreshKey = 0 } = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadFirstPage = useCallback(async () => {
    if (!enabled || !user?.uid) {
      setItems([]);
      setCursor(null);
      setHasMore(false);
      setError("");
      setLoading(false);
      setLoadingMore(false);
      return false;
    }

    setLoading(true);
    setError("");

    try {
      const page = await getTransactionPage({ uid: user.uid });
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      return true;
    } catch (fetchError) {
      logError("Error al cargar historial paginado", fetchError, {
        source: "transactions.paginated-history",
      });
      setError("No se pudo cargar el historial reciente.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.uid]);

  const loadMore = useCallback(async () => {
    if (!enabled || !user?.uid || !cursor || loadingMore) {
      return false;
    }

    setLoadingMore(true);
    setError("");

    try {
      const page = await getTransactionPage({ uid: user.uid, cursor });
      setItems((previous) => [...previous, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      return true;
    } catch (fetchError) {
      logError("Error al cargar mas transacciones", fetchError, {
        source: "transactions.paginated-history-more",
      });
      setError("No se pudo cargar mas movimientos.");
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, enabled, loadingMore, user?.uid]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, refreshKey]);

  return {
    paginatedTransactions: items,
    paginatedTransactionsError: error,
    paginatedTransactionsLoading: loading,
    loadingMorePaginatedTransactions: loadingMore,
    hasMorePaginatedTransactions: hasMore,
    reloadPaginatedTransactions: loadFirstPage,
    loadMorePaginatedTransactions: loadMore,
  };
}
