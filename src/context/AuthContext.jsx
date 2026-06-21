import React, { createContext, useContext, useEffect, useState } from "react";
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
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
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
import { logError } from "../services/logger";
import { removeProfilePhoto, uploadProfilePhoto } from "../services/profilePhotoService";
import {
  clearAccountDeletionInProgress,
  isAccountDeletionInProgress,
  markAccountDeletionInProgress,
} from "../utils/accountDeletion";

const AuthContext = createContext(null);
const DEFAULT_CURRENCY = "PEN";
const USER_OWNED_COLLECTIONS = [
  "transactions",
  "categories",
  "paymentMethods",
  "budgets",
  "notifications",
];
const ACCOUNT_DELETE_STEP_TIMEOUT_MS = 90000;

function withTimeout(promise, timeoutMs, timeoutCode, timeoutMessage) {
  let timeoutId = null;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error(timeoutMessage);
      timeoutError.code = timeoutCode;
      reject(timeoutError);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function deleteUserWithRestFallback(currentUser) {
  try {
    await withTimeout(
      deleteUser(currentUser),
      ACCOUNT_DELETE_STEP_TIMEOUT_MS,
      "auth/delete-timeout",
      "Firebase Auth tardo demasiado en eliminar la cuenta."
    );
    return;
  } catch (sdkError) {
    if (sdkError?.code === "auth/requires-recent-login") {
      throw sdkError;
    }

    const idToken = await withTimeout(
      currentUser.getIdToken(true),
      ACCOUNT_DELETE_STEP_TIMEOUT_MS,
      "auth/token-timeout",
      "No se pudo renovar el token para eliminar la cuenta."
    );
    const controller = new AbortController();
    const abortId = setTimeout(() => controller.abort(), ACCOUNT_DELETE_STEP_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
          signal: controller.signal,
        }
      );
    } catch (restCallError) {
      if (restCallError?.name === "AbortError") {
        const timeoutError = new Error("Firebase Auth no respondio a tiempo al eliminar la cuenta.");
        timeoutError.code = "auth/delete-timeout";
        timeoutError.cause = sdkError;
        throw timeoutError;
      }

      restCallError.code = restCallError.code || sdkError?.code || "auth/delete-failed";
      restCallError.cause = sdkError;
      throw restCallError;
    } finally {
      clearTimeout(abortId);
    }

    if (response.ok) {
      return;
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const restError = new Error(
      payload?.error?.message || "No se pudo eliminar la cuenta desde Firebase Auth."
    );
    restError.code = sdkError?.code || "auth/delete-failed";
    restError.cause = sdkError;
    throw restError;
  }
}

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
  await Promise.all(USER_OWNED_COLLECTIONS.map((collectionName) => deleteDocumentsByUid(collectionName, uid)));

  try {
    await withTimeout(
      removeProfilePhoto(uid),
      8000,
      "storage/profile-photo-cleanup-timeout",
      "La limpieza de la foto de perfil tardo demasiado."
    );
  } catch (error) {
    logError("No se pudo borrar la foto de perfil durante la eliminacion de cuenta", error, {
      source: "auth.delete-account-profile-photo-cleanup",
    });
  }

  await Promise.all([
    deleteDoc(doc(db, "notificationSettings", uid)),
    deleteDoc(doc(db, "users", uid)),
  ]);
}

function buildAccountCleanupError(error) {
  const cleanupError = new Error(
    "No se elimino la cuenta porque no se pudo limpiar completamente la informacion del usuario."
  );
  cleanupError.code = error?.code || "firestore/account-cleanup-failed";
  cleanupError.cause = error;
  cleanupError.cleanupMessage = error?.message || null;
  return cleanupError;
}

function buildAuthDeleteError(error) {
  const authDeleteError = new Error(
    "No se elimino la cuenta en Firebase Auth despues de limpiar los datos del usuario."
  );
  authDeleteError.code = "auth/delete-account-failed";
  authDeleteError.cause = error;
  return authDeleteError;
}

function buildDefaultProfile(currentUser, overrides = {}) {
  const alias = overrides.alias ?? currentUser.displayName ?? "";
  const photoURL = overrides.photoURL ?? currentUser.photoURL ?? "";

  return {
    uid: currentUser.uid,
    email: currentUser.email || "",
    alias,
    displayName: alias,
    photoURL,
    firstName: overrides.firstName ?? "",
    lastName: overrides.lastName ?? "",
    phone: overrides.phone ?? "",
    address: overrides.address ?? "",
    currency: overrides.currency ?? DEFAULT_CURRENCY,
    onboardingCompleted: overrides.onboardingCompleted ?? false,
    createdAt: overrides.createdAt ?? serverTimestamp(),
    updatedAt: overrides.updatedAt ?? serverTimestamp(),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const upsertAndGetUserProfile = async (currentUser) => {
    if (isAccountDeletionInProgress(currentUser.uid)) {
      return null;
    }

    const profileRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      const newProfile = buildDefaultProfile(currentUser);

      await setDoc(profileRef, newProfile);
      return {
        ...newProfile,
        createdAt: null,
        updatedAt: null,
      };
    }

    const profile = { id: snapshot.id, ...snapshot.data() };
    const authEmail = currentUser.email || "";
    const authAlias = currentUser.displayName || "";
    const authPhotoURL = currentUser.photoURL || "";
    const nextAlias = profile.alias || profile.displayName || authAlias || "";
    const nextPhotoURL = profile.photoURL || authPhotoURL || "";
    const needsProfileSync =
      (authEmail && profile.email !== authEmail) ||
      profile.alias !== nextAlias ||
      profile.displayName !== nextAlias ||
      (nextPhotoURL && profile.photoURL !== nextPhotoURL) ||
      profile.firstName === undefined ||
      profile.lastName === undefined ||
      profile.phone === undefined ||
      profile.address === undefined;

    if (needsProfileSync) {
      await setDoc(
        profileRef,
        {
          uid: currentUser.uid,
          email: authEmail,
          alias: nextAlias,
          displayName: nextAlias,
          photoURL: nextPhotoURL,
          firstName: profile.firstName ?? "",
          lastName: profile.lastName ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return {
        ...profile,
        email: authEmail,
        alias: nextAlias,
        displayName: nextAlias,
        photoURL: nextPhotoURL,
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
      };
    }

    return profile;
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
        logError("Error al cargar perfil de usuario", error, { source: "auth.profile-load" });
        setUserProfile(null);
      } finally {
        setLoadingAuth(false);
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, { alias } = {}) => {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    const safeAlias = alias?.trim() || "";

    if (safeAlias) {
      await updateProfile(credentials.user, { displayName: safeAlias });
      setUser({ ...credentials.user });
    }

    const baseProfile = buildDefaultProfile(credentials.user, {
      alias: safeAlias,
    });
    await setDoc(doc(db, "users", credentials.user.uid), baseProfile, { merge: true });
    setUserProfile({
      ...baseProfile,
      createdAt: null,
      updatedAt: null,
    });

    let verificationEmailSent = true;

    try {
      await sendEmailVerification(credentials.user);
    } catch (error) {
      verificationEmailSent = false;
      logError("No se pudo enviar verificacion automaticamente", error, {
        source: "auth.register-send-verification",
      });
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

  const updateUserEmail = async (newEmail, currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    await reauthenticate(currentPassword);
    await verifyBeforeUpdateEmail(currentUser, newEmail);

    return { verificationEmailSent: true, pendingEmail: newEmail };
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    await reauthenticate(currentPassword);
    await updatePassword(currentUser, newPassword);
  };

  const updateUserProfileDetails = async ({
    alias,
    firstName = "",
    lastName = "",
    phone = "",
    address = "",
    photoFile = null,
    removePhoto = false,
  }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    const safeAlias = alias.trim();
    if (!safeAlias) {
      throw new Error("Debes ingresar un alias");
    }

    let safePhotoURL = currentUser.photoURL?.trim() || userProfile?.photoURL?.trim() || "";

    if (photoFile) {
      const uploadResult = await uploadProfilePhoto(currentUser.uid, photoFile);
      safePhotoURL = uploadResult.photoURL;
    } else if (removePhoto) {
      await removeProfilePhoto(currentUser.uid);
      safePhotoURL = "";
    }

    await updateProfile(currentUser, {
      displayName: safeAlias,
      photoURL: safePhotoURL || null,
    });
    setUser({ ...currentUser });

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || "",
        alias: safeAlias,
        displayName: safeAlias,
        photoURL: safePhotoURL,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await refreshUserProfile();
  };

  const deleteUserAccount = async (currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    const uid = currentUser.uid;

    markAccountDeletionInProgress(uid);

    try {
      await withTimeout(
        reauthenticate(currentPassword),
        ACCOUNT_DELETE_STEP_TIMEOUT_MS,
        "auth/reauth-timeout",
        "La reautenticacion tardo demasiado."
      );

      try {
        await withTimeout(
          purgeUserData(uid),
          ACCOUNT_DELETE_STEP_TIMEOUT_MS,
          "firestore/account-cleanup-timeout",
          "La limpieza de datos tardo demasiado."
        );
      } catch (error) {
        logError("No se completo la limpieza de datos de usuario", error, {
          source: "auth.delete-account-cleanup",
          uid,
        });
        throw buildAccountCleanupError(error);
      }

      try {
        await deleteUserWithRestFallback(currentUser);
        await withTimeout(
          signOut(auth).catch(() => {}),
          5000,
          "auth/signout-timeout",
          "El cierre de sesion tardo demasiado."
        );
      } catch (error) {
        logError("No se pudo eliminar la cuenta en Firebase Auth", error, {
          source: "auth.delete-account-auth-delete",
          uid,
        });
        throw buildAuthDeleteError(error);
      }
    } finally {
      clearAccountDeletionInProgress(uid);
    }

    return { deleted: true };
  };

  const completeOnboarding = async ({ alias = "", currency }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    const safeAlias =
      alias.trim() ||
      currentUser.displayName?.trim() ||
      userProfile?.alias?.trim() ||
      userProfile?.displayName?.trim() ||
      "";
    const safeCurrency = currency || DEFAULT_CURRENCY;

    if (!safeAlias) {
      throw new Error("Debes definir un alias visible");
    }

    await updateProfile(currentUser, { displayName: safeAlias });
    setUser({ ...currentUser });

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || "",
        alias: safeAlias,
        displayName: safeAlias,
        photoURL: currentUser.photoURL || "",
        currency: safeCurrency,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await refreshUserProfile();
  };

  const value = {
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
    updateUserProfileDetails,
    updateUserEmail,
    updateUserPassword,
    deleteUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
