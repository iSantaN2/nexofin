import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { logError } from "../services/logger";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { isAccountDeletionInProgress } from "../utils/accountDeletion";
import { normalizeCategoryType, normalizeText } from "../utils/validation";

const CategoriesContext = createContext();
export const useCategories = () => useContext(CategoriesContext);

const DEFAULT_CATEGORIES = [
  { name: "Comida", type: "gasto" },
  { name: "Gasolina", type: "gasto" },
  { name: "Pasajes", type: "gasto" },
  { name: "Ocio", type: "gasto" },
  { name: "Salario", type: "ingreso" },
];

function buildDefaultCategoryId(uid, category) {
  return `${uid}_default_${category.type}_${category.name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 180);
}

export const CategoriesProvider = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const initializedUidRef = useRef(null);
  const initializingDefaultsRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setCategories([]);
      initializedUidRef.current = null;
      initializingDefaultsRef.current = false;
      return;
    }

    const q = query(collection(db, "categories"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (isAccountDeletionInProgress(user.uid)) {
          setCategories([]);
          return;
        }

        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(data);

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
              DEFAULT_CATEGORIES.map((cat) =>
                setDoc(doc(db, "categories", buildDefaultCategoryId(user.uid, cat)), {
                  ...cat,
                  uid: user.uid,
                })
              )
            );
            toast.success("Categorias iniciales anadidas");
          }
          initializedUidRef.current = user.uid;
        } catch (error) {
          logError("Error al inicializar categorias", error, { source: "categories.seed" });
          toast.error("No se pudieron crear las categorias iniciales");
        } finally {
          initializingDefaultsRef.current = false;
        }
      },
      (error) => {
        logError("Error al cargar categorias", error, { source: "categories.listener" });
        setCategories([]);
        toast.error("No se pudieron cargar las categorias");
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const addCategory = async (name, type = "gasto") => {
    if (!user?.uid) return toast.error("Debes iniciar sesion");

    const trimmed = normalizeText(name, 60);
    const safeType = normalizeCategoryType(type);
    if (!trimmed) return toast.error("El nombre no puede estar vacio");

    const duplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        c.type?.toLowerCase() === safeType
    );

    if (duplicate) {
      toast.error(`La categoria "${trimmed}" ya existe en ${safeType}.`);
      return;
    }

    try {
      await addDoc(collection(db, "categories"), { name: trimmed, type: safeType, uid: user.uid });
      toast.success(`Categoria "${trimmed}" anadida correctamente a ${safeType}`);
    } catch (error) {
      logError("Error al anadir categoria", error, { source: "categories.add" });
      toast.error("Error al anadir categoria");
    }
  };

  const editCategory = async (id, newData) => {
    const trimmedName = normalizeText(newData.name, 60);
    const newType = normalizeCategoryType(newData.type);

    if (!trimmedName) return toast.error("El nombre no puede estar vacio");

    const duplicate = categories.some(
      (c) =>
        c.id !== id &&
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.type?.toLowerCase() === newType
    );

    if (duplicate) return toast.error(`La categoria "${trimmedName}" ya existe en ${newType}.`);

    try {
      await updateDoc(doc(db, "categories", id), {
        name: trimmedName,
        type: newType,
      });
      toast.success("Categoria actualizada correctamente");
    } catch (error) {
      logError("Error al editar categoria", error, { source: "categories.edit" });
      toast.error("No se pudo actualizar la categoria");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Categoria eliminada correctamente");
    } catch (error) {
      logError("Error al eliminar categoria", error, { source: "categories.delete" });
      toast.error("No se pudo eliminar la categoria");
    }
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        editCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};
