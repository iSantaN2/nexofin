import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { isValidMonthKey, normalizePositiveAmount, normalizeText } from "../utils/validation";

function normalizeBudgetInput({ category, monthKey, limitAmount }) {
  const normalizedCategory = normalizeText(category, 80);
  const normalizedMonth = (monthKey || "").trim();
  const amount = normalizePositiveAmount(limitAmount);

  if (!normalizedCategory || !isValidMonthKey(normalizedMonth) || amount <= 0) {
    throw new Error("Datos invalidos en la meta");
  }

  return {
    category: normalizedCategory,
    monthKey: normalizedMonth,
    limitAmount: amount,
  };
}

export async function upsertBudgetDoc({ uid, budgets, category, monthKey, limitAmount }) {
  if (!uid) {
    throw new Error("Debes iniciar sesion");
  }

  const cleanBudget = normalizeBudgetInput({ category, monthKey, limitAmount });
  const now = new Date().toISOString();
  const existing = budgets.find(
    (item) => item.category === cleanBudget.category && item.monthKey === cleanBudget.monthKey
  );

  if (existing?.id) {
    await updateDoc(doc(db, "budgets", existing.id), {
      limitAmount: cleanBudget.limitAmount,
      updatedAt: now,
    });
    return existing.id;
  }

  const docRef = await addDoc(collection(db, "budgets"), {
    uid,
    category: cleanBudget.category,
    monthKey: cleanBudget.monthKey,
    limitAmount: cleanBudget.limitAmount,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function deleteBudgetDoc({ uid, id }) {
  if (!uid || !id) {
    throw new Error("No se puede eliminar la meta sin sesion o id valido");
  }

  await deleteDoc(doc(db, "budgets", id));
  return true;
}
