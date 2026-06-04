import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { AppContext } from "./AppContext";
import {
  normalizeIsoDate,
  normalizeOptionalText,
  normalizePositiveAmount,
  normalizeText,
  normalizeType,
} from "../utils/validation";

export const TransactionsContext = createContext();

const MONTH_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
});

function getMonthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = MONTH_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : "";
}

function isIncomeTransaction(transaction) {
  return transaction?.type === "Ingreso" || transaction?.type === "income";
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
  const { createNotification } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }

    const q = query(collection(db, "transactions"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sanitizeTransaction = (data) => {
    const { id: _id, ...rest } = data;
    const now = new Date();
    const fixedDate = normalizeIsoDate(rest.date, now);
    const fixedCreatedAt = normalizeIsoDate(rest.createdAt, now);
    const amount = normalizePositiveAmount(rest.amount);
    const category = normalizeText(
      typeof rest.category === "object" ? rest.category?.name : rest.category,
      80
    );
    const account = normalizeText(
      typeof rest.account === "object" ? rest.account?.name : rest.account,
      80
    );
    const notes = normalizeOptionalText(rest.notes, 500);
    const type = normalizeType(rest.type);

    if (!category || !account || amount <= 0) {
      return null;
    }

    return {
      uid: user?.uid,
      category,
      account,
      amount,
      date: fixedDate,
      createdAt: fixedCreatedAt,
      type,
      notes,
    };
  };

  const addTransaction = async (transaction) => {
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
      const docRef = await addDoc(collection(db, "transactions"), cleanData);
      const unusualSignal = getUnusualExpenseSignal(cleanData, transactions);
      if (unusualSignal) {
        const monthKey = getMonthKey(cleanData.date);
        await createNotification({
          type: "unusual_expense",
          title: `Gasto inusual: ${cleanData.category}`,
          message: `Este gasto fue S/ ${unusualSignal.increaseAmount.toFixed(2)} mayor que tu promedio en esta categoria.`,
          recommendation: `Revisa si este gasto de ${cleanData.category} fue puntual. Si se repetira, considera ajustar tu meta o recortar otros gastos del mes.`,
          actionPath: `/transactions?category=${encodeURIComponent(cleanData.category)}`,
          severity: "warning",
          sourceKey: `unusual-transaction-${monthKey}-${cleanData.category}-${docRef.id}`,
          monthKey,
        });
      }
      toast.success("Transaccion anadida correctamente", { id: toastId });
      return docRef.id;
    } catch (error) {
      console.error("Error al agregar transaccion:", error);
      toast.error("Error al agregar transaccion", { id: toastId });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (transaction) => {
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
      await updateDoc(doc(db, "transactions", id), cleanData);

      toast.success("Transaccion actualizada correctamente", { id: toastId });
      return true;
    } catch (error) {
      console.error("Error al actualizar transaccion:", error);
      toast.error("Error al actualizar transaccion", { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!user?.uid) {
      toast.error("Debes iniciar sesion");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Eliminando transaccion...");
    try {
      if (!id || typeof id !== "string") throw new Error("ID invalido");

      await deleteDoc(doc(db, "transactions", id));
      toast.success("Transaccion eliminada correctamente", { id: toastId });
    } catch (error) {
      console.error("Error al eliminar transaccion:", error);
      toast.error("No se pudo eliminar la transaccion", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        loading,
      }}
    >
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
          <div className="w-14 h-14 border-4 border-white border-t-[#1f67ff] rounded-full animate-spin"></div>
        </div>
      )}
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionsContext);
}

