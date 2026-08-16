import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import { ensureUserDirectoryEntry, registerCurrentUserEmail } from "../utils/userLookup";

const AuthContext = createContext(null);

const LOCAL_DEMO_USER = {
  uid: "local-demo",
  email: "demo@local",
  isDemo: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(LOCAL_DEMO_USER);
      setLoading(false);
      return undefined;
    }

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
      setUser(LOCAL_DEMO_USER);
      return { user: LOCAL_DEMO_USER };
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDirectoryEntry(result.user).catch(() => {});
    return result;
  };

  const signup = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      setUser(LOCAL_DEMO_USER);
      return { user: LOCAL_DEMO_USER };
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDirectoryEntry(result.user).catch(() => {});
    return result;
  };

  const logout = () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(LOCAL_DEMO_USER);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, isFirebaseConfigured }}
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
