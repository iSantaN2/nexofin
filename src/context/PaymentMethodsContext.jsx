import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { db } from "../firebase/config";
import { logError } from "../services/logger";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { isAccountDeletionInProgress } from "../utils/accountDeletion";
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

function buildDefaultMethodId(uid, method) {
  return `${uid}_default_${method.name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 180);
}

export const PaymentMethodsProvider = ({ children }) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const initializedUidRef = useRef(null);
  const initializingDefaultsRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setMethods([]);
      initializedUidRef.current = null;
      initializingDefaultsRef.current = false;
      return;
    }

    const q = query(collection(db, "paymentMethods"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (isAccountDeletionInProgress(user.uid)) {
          setMethods([]);
          return;
        }

        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMethods(data);

        if (data.length > 0) {
          initializedUidRef.current = user.uid;
          return;
        }

        if (initializedUidRef.current === user.uid || initializingDefaultsRef.current) {
          return;
        }

        initializingDefaultsRef.current = true;

        try {
          const existing = await getDocs(q);
          if (existing.empty) {
            await Promise.all(
              DEFAULT_METHODS.map((method) =>
                setDoc(doc(db, "paymentMethods", buildDefaultMethodId(user.uid, method)), {
                  ...method,
                  uid: user.uid,
                })
              )
            );
            toast.success("Metodos de pago iniciales anadidos");
          }
          initializedUidRef.current = user.uid;
        } catch (error) {
          logError("Error al inicializar metodos de pago", error, {
            source: "payment-methods.seed",
          });
          toast.error("No se pudieron crear los metodos de pago iniciales");
        } finally {
          initializingDefaultsRef.current = false;
        }
      },
      (error) => {
        logError("Error al cargar metodos de pago", error, {
          source: "payment-methods.listener",
        });
        setMethods([]);
        toast.error("No se pudieron cargar los metodos de pago");
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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
      logError("Error al anadir metodo", error, { source: "payment-methods.add" });
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
      logError("Error al editar metodo", error, { source: "payment-methods.edit" });
      toast.error("No se pudo actualizar el metodo");
    }
  };

  const deleteMethod = async (id) => {
    try {
      await deleteDoc(doc(db, "paymentMethods", id));
      toast.success("Metodo eliminado correctamente");
    } catch (error) {
      logError("Error al eliminar metodo", error, { source: "payment-methods.delete" });
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
