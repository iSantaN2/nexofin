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

const DEFAULT_METHODS = [
  { name: "Efectivo" },
  { name: "Tarjeta" },
  { name: "Transferencia" },
  { name: "Yape" },
  { name: "Plin" },
];

export const PaymentMethodsProvider = ({ children }) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [initialized, setInitialized] = useState(false);

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
          for (const method of DEFAULT_METHODS) {
            await addDoc(collection(db, "paymentMethods"), {
              ...method,
              uid: user.uid,
            });
          }
          toast.success("Métodos de pago iniciales añadidos");
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, initialized]);

  const addMethod = async (name) => {
    if (!user?.uid) return toast.error("Debes iniciar sesión");

    const trimmed = normalizeText(name, 60);
    if (!trimmed) return toast.error("El nombre no puede estar vacio");

    const exists = methods.some((m) => m.name.toLowerCase() === trimmed.toLowerCase());

    if (exists) {
      toast.error(`El método "${trimmed}" ya existe.`);
      return;
    }

    try {
      await addDoc(collection(db, "paymentMethods"), { name: trimmed, uid: user.uid });
      toast.success(`Método "${trimmed}" anadido correctamente`);
    } catch (error) {
      console.error("Error al añadir método:", error);
      toast.error("No se pudo añadir el método");
    }
  };

  const editMethod = async (id, name) => {
    const trimmed = normalizeText(name, 60);
    if (!trimmed) return toast.error("El nombre no puede estar vacio");

    const duplicate = methods.some(
      (m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicate) {
      toast.error(`Ya existe un método con el nombre "${trimmed}"`);
      return;
    }

    try {
      await updateDoc(doc(db, "paymentMethods", id), { name: trimmed });
      toast.success("Método actualizado correctamente");
    } catch (error) {
      console.error("Error al editar método:", error);
      toast.error("No se pudo actualizar el método");
    }
  };

  const deleteMethod = async (id) => {
    try {
      await deleteDoc(doc(db, "paymentMethods", id));
      toast.success("Método eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar método:", error);
      toast.error("No se pudo eliminar el método");
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
