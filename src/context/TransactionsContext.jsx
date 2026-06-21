import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { logError } from "../services/logger";
import { useAuth } from "./AuthContext";
import { AppContext } from "./AppContext";
import { buildBudgetAlertNotification } from "../utils/budgetNotifications";
import { formatCurrency, getMonthKey } from "../utils/formatters";
import {
  createTransactionDoc,
  deleteTransactionDoc,
  sanitizeTransactionInput,
  subscribeToTransactions,
  updateTransactionDoc,
} from "../services/transactionService";

export const TransactionsContext = createContext();

function isIncomeTransaction(transaction) {
  return transaction?.type === "Ingreso" || transaction?.type === "income";
}

function getCategoryValue(value) {
  return typeof value === "object" ? value?.name || "" : value || "";
}

function getUnusualExpenseSignal(transaction, history) {
  if (!transaction || isIncomeTransaction(transaction)) return null;

  const amount = Number(transaction.amount) || 0;
  const sameCategoryExpenses = history
    .filter((item) => item.category === transaction.category)
    .filter((item) => !isIncomeTransaction(item))
    .map((item) => Number(item.amount) || 0)
    .filter((value) => value > 0);

  if (sameCategoryExpenses.length < 3) return null;

  const average =
    sameCategoryExpenses.reduce((sum, value) => sum + value, 0) / sameCategoryExpenses.length;
  const increaseAmount = amount - average;
  const increasePercent = average > 0 ? (increaseAmount / average) * 100 : null;

  if (amount >= average * 1.5 && increaseAmount >= 30) {
    return {
      average,
      increaseAmount,
      increasePercent,
    };
  }

  return null;
}

export function TransactionsProvider({ children }) {
  const { user } = useAuth();
  const { budgets, createNotification, notificationSettings } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }

    const unsubscribe = subscribeToTransactions(user.uid, {
      onData: (data) => {
        setTransactions(data);
      },
      onError: (error) => {
        logError("Error al cargar transacciones", error, {
          source: "transactions.listener",
        });
        setTransactions([]);
        toast.error("No se pudieron cargar las transacciones");
      },
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sanitizeTransaction = useCallback(
    (data) => sanitizeTransactionInput(data, user?.uid),
    [user?.uid]
  );

  const addTransaction = useCallback(async (transaction) => {
    if (!user?.uid) {
      toast.error("Debes iniciar sesion");
      return null;
    }

    setLoading(true);
    const toastId = toast.loading("Guardando transaccion...");

    try {
      const cleanData = sanitizeTransaction(transaction);
      if (!cleanData) {
        toast.error("Datos invalidos en la transaccion");
        return null;
      }

      const transactionId = await createTransactionDoc(cleanData);
      const monthKey = getMonthKey(cleanData.date);
      const unusualSignal = getUnusualExpenseSignal(cleanData, transactions);
      const followUpTasks = [];

      if (unusualSignal) {
        followUpTasks.push(
          createNotification({
            type: "unusual_expense",
            title: `Gasto inusual: ${cleanData.category}`,
            message: `Este gasto fue ${formatCurrency(unusualSignal.increaseAmount)} mayor que tu promedio en esta categoria.`,
            recommendation: `Revisa si este gasto de ${cleanData.category} fue puntual. Si se repetira, considera ajustar tu meta o recortar otros gastos del mes.`,
            actionPath: `/transactions?category=${encodeURIComponent(cleanData.category)}`,
            severity: "warning",
            sourceKey: `unusual-transaction-${monthKey}-${cleanData.category}-${transactionId}`,
            monthKey,
          })
        );
      }

      if (!isIncomeTransaction(cleanData)) {
        const activeBudget = budgets.find(
          (item) => item.category === cleanData.category && item.monthKey === monthKey
        );

        if (activeBudget) {
          const spentBeforeNewTransaction = transactions
            .filter((item) => !isIncomeTransaction(item))
            .filter((item) => getMonthKey(item.date) === monthKey)
            .filter((item) => getCategoryValue(item.category) === cleanData.category)
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          const budgetNotification = buildBudgetAlertNotification({
            category: cleanData.category,
            spent: spentBeforeNewTransaction + cleanData.amount,
            limit: activeBudget.limitAmount,
            monthKey,
            notificationSettings,
            reactivate: true,
          });

          if (budgetNotification) {
            followUpTasks.push(createNotification(budgetNotification));
          }
        }
      }

      if (followUpTasks.length > 0) {
        Promise.allSettled(followUpTasks).then((results) => {
          results.forEach((result) => {
            if (result.status === "rejected") {
              logError("Error al crear notificacion derivada", result.reason, {
                source: "transactions.add-follow-up-notification",
              });
            }
          });
        });
      }

      toast.success("Transaccion anadida correctamente", { id: toastId });
      return transactionId;
    } catch (error) {
      logError("Error al agregar transaccion", error, { source: "transactions.add" });
      toast.error("Error al agregar transaccion", { id: toastId });
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, createNotification, notificationSettings, sanitizeTransaction, transactions, user?.uid]);

  const updateTransaction = useCallback(async (transaction) => {
    const id = transaction?.id;
    if (!user?.uid) {
      toast.error("Debes iniciar sesion");
      return false;
    }

    setLoading(true);
    const toastId = toast.loading("Actualizando transaccion...");

    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID invalido al actualizar transaccion");
      }

      const cleanData = sanitizeTransaction(transaction);
      if (!cleanData) {
        throw new Error("Datos invalidos en la transaccion");
      }

      await updateTransactionDoc(id, cleanData);
      toast.success("Transaccion actualizada correctamente", { id: toastId });
      return true;
    } catch (error) {
      logError("Error al actualizar transaccion", error, { source: "transactions.update" });
      toast.error("Error al actualizar transaccion", { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  }, [sanitizeTransaction, user?.uid]);

  const deleteTransaction = useCallback(async (id) => {
    if (!user?.uid) {
      toast.error("Debes iniciar sesion");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Eliminando transaccion...");

    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID invalido");
      }

      await deleteTransactionDoc(id);
      toast.success("Transaccion eliminada correctamente", { id: toastId });
    } catch (error) {
      logError("Error al eliminar transaccion", error, { source: "transactions.delete" });
      toast.error("No se pudo eliminar la transaccion", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      loading,
    }),
    [addTransaction, deleteTransaction, loading, transactions, updateTransaction]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-[#1f67ff]" />
        </div>
      )}
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}
