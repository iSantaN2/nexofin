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
import {
  normalizeIsoDate,
  normalizeOptionalText,
  normalizePositiveAmount,
  normalizeText,
  normalizeType,
} from "../utils/validation";

export const TransactionsContext = createContext();

export function TransactionsProvider({ children }) {
  const { user } = useAuth();
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
    const { id, ...rest } = data;
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
