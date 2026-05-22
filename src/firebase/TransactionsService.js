import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./config";

// Escuchar las transacciones en tiempo real
export const getTransactions = (setTransactions) => {
  const unsub = onSnapshot(collection(db, "transactions"), (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTransactions(data);
  });

  return unsub;
};

// Agregar una nueva transacción
export const addTransaction = async (transaction) => {
  try {
    await addDoc(collection(db, "transactions"), transaction);
  } catch (error) {
    console.error("Error al agregar transacción:", error);
  }
};

// Eliminar una transacción
export const deleteTransaction = async (id) => {
  try {
    await deleteDoc(doc(db, "transactions", id));
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
  }
};
