import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { normalizeCategoryType, normalizeText } from "../utils/validation";

const CategoriesContext = createContext();
export const useCategories = () => useContext(CategoriesContext);

export const CategoriesProvider = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const defaultCategories = [
    { name: "Comida", type: "gasto" },
    { name: "Gasolina", type: "gasto" },
    { name: "Pasajes", type: "gasto" },
    { name: "Ocio", type: "gasto" },
    { name: "Salario", type: "ingreso" },
  ];

  useEffect(() => {
    if (!user?.uid) {
      setCategories([]);
      setInitialized(false);
      return;
    }

    const q = query(collection(db, "categories"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(data);

      if (data.length === 0 && !initialized) {
        setInitialized(true);
        const existing = await getDocs(q);
        if (existing.empty) {
          for (const cat of defaultCategories) {
            await addDoc(collection(db, "categories"), { ...cat, uid: user.uid });
          }
          toast.success("Categorias iniciales anadidas");
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, initialized]);

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
      console.error("Error al anadir categoria:", error);
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
      console.error("Error al editar categoria:", error);
      toast.error("No se pudo actualizar la categoria");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Categoria eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar categoria:", error);
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
