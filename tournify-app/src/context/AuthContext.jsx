import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";

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
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const login = (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      setUser(LOCAL_DEMO_USER);
      return Promise.resolve({ user: LOCAL_DEMO_USER });
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      setUser(LOCAL_DEMO_USER);
      return Promise.resolve({ user: LOCAL_DEMO_USER });
    }
    return createUserWithEmailAndPassword(auth, email, password);
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
