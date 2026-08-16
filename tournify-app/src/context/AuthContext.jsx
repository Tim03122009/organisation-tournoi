import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import { ensureUserDirectoryEntry, normalizeEmail, registerCurrentUserEmail } from "../utils/userLookup";

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function notConfiguredError() {
  const err = new Error("Firebase n'est pas configuré.");
  err.code = "auth/not-configured";
  return err;
}

async function afterSignIn(user) {
  if (user?.email) {
    registerCurrentUserEmail(user.email);
  }
  await ensureUserDirectoryEntry(user).catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) afterSignIn(result.user).catch(() => {});
      })
      .catch((err) => {
        console.warn("Retour connexion Google:", err);
      });

    return onAuthStateChanged(auth, (nextUser) => {
      if (nextUser?.email) {
        registerCurrentUserEmail(nextUser.email);
        ensureUserDirectoryEntry(nextUser).catch((err) => {
          console.warn("Index utilisateur impossible:", err);
        });
      }
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw notConfiguredError();
    }
    const result = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    await afterSignIn(result.user);
    return result;
  };

  const signup = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw notConfiguredError();
    }
    const result = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
    await afterSignIn(result.user);
    return result;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw notConfiguredError();
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await afterSignIn(result.user);
      return result;
    } catch (err) {
      if (err?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  };

  const logout = () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
