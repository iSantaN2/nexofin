import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { normalizeText } from "../utils/validation";

const PaymentMethodsContext = createContext();
export const usePaymentMethods = () => useContext(PaymentMethodsContext);

export const PaymentMethodsProvider = ({ children }) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const defaultMethods = [
    { name: "Efectivo" },
    { name: "Tarjeta" },
    { name: "Transferencia" },
    { name: "Yape" },
    { name: "Plin" },
  ];

  useEffect(() => {
    if (!user?.uid) {
      setMethods([]);
      setInitialized(false);
      return;
    }

    const q = query(collection(db, "paymentMethods"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMethods(data);

      if (data.length === 0 && !initialized) {
        setInitialized(true);
        const existing = await getDocs(q);
        if (existing.empty) {
          for (const method of defaultMethods) {
            await addDoc(collection(db, "paymentMethods"), {
              ...method,
              uid: user.uid,
            });
          }
          toast.success("Metodos de pago iniciales anadidos");
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, initialized]);

  const addMethod = async (name) => {
    if (!user?.uid) return toast.error("Debes iniciar sesion");

    const trimmed = normalizeText(name, 60);
    if (!trimmed) return toast.error("El nombre no puede estar vacio");

    const exists = methods.some((m) => m.name.toLowerCase() === trimmed.toLowerCase());

    if (exists) {
      toast.error(`El metodo "${trimmed}" ya existe.`);
      return;
    }

    try {
      await addDoc(collection(db, "paymentMethods"), { name: trimmed, uid: user.uid });
      toast.success(`Metodo "${trimmed}" anadido correctamente`);
    } catch (error) {
      console.error("Error al anadir metodo:", error);
      toast.error("No se pudo anadir el metodo");
    }
  };

  const editMethod = async (id, name) => {
    const trimmed = normalizeText(name, 60);
    if (!trimmed) return toast.error("El nombre no puede estar vacio");

    const duplicate = methods.some(
      (m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicate) {
      toast.error(`Ya existe un metodo con el nombre "${trimmed}"`);
      return;
    }

    try {
      await updateDoc(doc(db, "paymentMethods", id), { name: trimmed });
      toast.success("Metodo actualizado correctamente");
    } catch (error) {
      console.error("Error al editar metodo:", error);
      toast.error("No se pudo actualizar el metodo");
    }
  };

  const deleteMethod = async (id) => {
    try {
      await deleteDoc(doc(db, "paymentMethods", id));
      toast.success("Metodo eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar metodo:", error);
      toast.error("No se pudo eliminar el metodo");
    }
  };

  return (
    <PaymentMethodsContext.Provider
      value={{
        methods,
        addMethod,
        editMethod,
        deleteMethod,
      }}
    >
      {children}
    </PaymentMethodsContext.Provider>
  );
};
