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
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  normalizeIsoDate,
  normalizeOptionalText,
  normalizePositiveAmount,
  normalizeText,
  normalizeType,
} from "../utils/validation";

function compareTransactionsByCreatedAtDesc(left, right) {
  const leftDate = new Date(left.createdAt || left.date || 0).getTime();
  const rightDate = new Date(right.createdAt || right.date || 0).getTime();
  return rightDate - leftDate;
}

function mapTransactionDoc(item) {
  return {
    id: item.id,
    ...item.data(),
  };
}

export function isFirestoreIndexError(error) {
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return error?.code === "failed-precondition" || message.includes("index");
}

function sortTransactions(items) {
  return [...items].sort(compareTransactionsByCreatedAtDesc);
}

export function subscribeToTransactions(uid, { onData, onError }) {
  const orderedTransactionsQuery = query(
    collection(db, "transactions"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const fallbackTransactionsQuery = query(
    collection(db, "transactions"),
    where("uid", "==", uid)
  );

  let unsubscribe = () => {};

  const subscribeWithFallback = () =>
    onSnapshot(
      fallbackTransactionsQuery,
      (snapshot) => {
        onData(sortTransactions(snapshot.docs.map(mapTransactionDoc)));
      },
      onError
    );

  unsubscribe = onSnapshot(
    orderedTransactionsQuery,
    (snapshot) => {
      onData(snapshot.docs.map(mapTransactionDoc));
    },
    (error) => {
      if (isFirestoreIndexError(error)) {
        unsubscribe();
        unsubscribe = subscribeWithFallback();
        return;
      }

      onError(error);
    }
  );

  return () => unsubscribe();
}

const TRANSACTIONS_PAGE_SIZE = 20;

export async function getTransactionPage({
  uid,
  cursor = null,
  pageSize = TRANSACTIONS_PAGE_SIZE,
} = {}) {
  if (!uid) {
    return {
      items: [],
      cursor: null,
      hasMore: false,
    };
  }

  const constraints = [
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1),
  ];

  if (cursor && !(typeof cursor === "object" && cursor !== null && "offset" in cursor)) {
    constraints.splice(2, 0, startAfter(cursor));
  }

  try {
    const snapshot = await getDocs(query(collection(db, "transactions"), ...constraints));
    const pageDocs = snapshot.docs.slice(0, pageSize);

    return {
      items: pageDocs.map(mapTransactionDoc),
      cursor: pageDocs.at(-1) || null,
      hasMore: snapshot.docs.length > pageSize,
    };
  } catch (error) {
    if (!isFirestoreIndexError(error)) {
      throw error;
    }

    const fallbackSnapshot = await getDocs(
      query(collection(db, "transactions"), where("uid", "==", uid))
    );
    const allItems = sortTransactions(fallbackSnapshot.docs.map(mapTransactionDoc));
    const currentOffset =
      typeof cursor === "object" && cursor !== null && "offset" in cursor ? cursor.offset : 0;
    const items = allItems.slice(currentOffset, currentOffset + pageSize);
    const nextOffset = currentOffset + items.length;

    return {
      items,
      cursor: nextOffset < allItems.length ? { offset: nextOffset } : null,
      hasMore: nextOffset < allItems.length,
    };
  }
}

export function sanitizeTransactionInput(data, uid) {
  const { id: _id, ...rest } = data || {};
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

  if (!uid || !category || !account || amount <= 0) {
    return null;
  }

  return {
    uid,
    category,
    account,
    amount,
    date: fixedDate,
    createdAt: fixedCreatedAt,
    type,
    notes,
  };
}

export async function createTransactionDoc(data) {
  const docRef = await addDoc(collection(db, "transactions"), data);
  return docRef.id;
}

export async function updateTransactionDoc(id, data) {
  await updateDoc(doc(db, "transactions", id), data);
}

export async function deleteTransactionDoc(id) {
  await deleteDoc(doc(db, "transactions", id));
}
