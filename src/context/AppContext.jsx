import React, { createContext, useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { isValidMonthKey, normalizePositiveAmount, normalizeText } from "../utils/validation";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const value = useMemo(
    () => ({
      budgets,
      loading,
      upsertBudget,
      deleteBudget,
    }),
    [budgets, loading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
