import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);
const DEFAULT_CURRENCY = "PEN";

async function deleteDocumentsByUid(collectionName, uid) {
  const q = query(collection(db, collectionName), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const docs = snapshot.docs;
  const BATCH_LIMIT = 500;

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + BATCH_LIMIT);

    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  }
}

async function purgeUserData(uid) {
  await deleteDocumentsByUid("transactions", uid);
  await deleteDocumentsByUid("categories", uid);
  await deleteDocumentsByUid("paymentMethods", uid);
  await deleteDocumentsByUid("budgets", uid);
  await deleteDoc(doc(db, "users", uid));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const upsertAndGetUserProfile = async (currentUser) => {
    const profileRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      const newProfile = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || "",
        currency: DEFAULT_CURRENCY,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(profileRef, newProfile);
      return {
        ...newProfile,
        createdAt: null,
        updatedAt: null,
      };
    }

    return { id: snapshot.id, ...snapshot.data() };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        setLoadingAuth(false);
        setLoadingProfile(false);
        return;
      }

      setUser(currentUser);
      setLoadingProfile(true);

      try {
        const profile = await upsertAndGetUserProfile(currentUser);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error al cargar perfil de usuario:", error);
        setUserProfile(null);
      } finally {
        setLoadingAuth(false);
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password) => {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    let verificationEmailSent = true;

    try {
      await sendEmailVerification(credentials.user);
    } catch (error) {
      verificationEmailSent = false;
      console.error("No se pudo enviar verificacion automaticamente:", error);
    }

    return { credentials, verificationEmailSent };
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  const resendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }
    await sendEmailVerification(currentUser);
  };

  const refreshCurrentUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUser(null);
      return null;
    }

    await reload(currentUser);
    setUser({ ...currentUser });
    return currentUser;
  };

  const refreshUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserProfile(null);
      return null;
    }

    const profile = await upsertAndGetUserProfile(currentUser);
    setUserProfile(profile);
    return profile;
  };

  const reauthenticate = async (currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error("No hay usuario autenticado");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
  };

  const updateUserDisplayName = async (displayName) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    await updateProfile(currentUser, { displayName });
    setUser({ ...currentUser });
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await refreshUserProfile();
  };

  const updateUserEmail = async (newEmail, currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    await reauthenticate(currentPassword);
    await updateEmail(currentUser, newEmail);
    setUser({ ...currentUser });
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: newEmail,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await refreshUserProfile();
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    await reauthenticate(currentPassword);
    await updatePassword(currentUser, newPassword);
  };

  const deleteUserAccount = async (currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    const uid = currentUser.uid;

    await reauthenticate(currentPassword);
    let dataCleanupError = null;
    try {
      await purgeUserData(uid);
    } catch (error) {
      dataCleanupError = error;
    }
    await deleteUser(currentUser);

    return { dataCleanupError };
  };

  const completeOnboarding = async ({ displayName, currency }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    const safeName = displayName.trim();
    const safeCurrency = currency || DEFAULT_CURRENCY;

    if (!safeName) {
      throw new Error("Debes ingresar un nombre");
    }

    await updateProfile(currentUser, { displayName: safeName });
    setUser({ ...currentUser });

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: safeName,
        currency: safeCurrency,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await refreshUserProfile();
  };

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loadingAuth,
      loadingProfile,
      register,
      login,
      resetPassword,
      logout,
      resendVerificationEmail,
      refreshCurrentUser,
      refreshUserProfile,
      completeOnboarding,
      updateUserDisplayName,
      updateUserEmail,
      updateUserPassword,
      deleteUserAccount,
    }),
    [user, userProfile, loadingAuth, loadingProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
