import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isProfileComplete, loadUserProfile } from "../utils/userProfile";

export default function ProfileGate({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    const uid = user?.uid;
    if (!uid) {
      setStatus("missing");
      return undefined;
    }

    setStatus("loading");
    loadUserProfile(uid).then((profile) => {
      if (cancelled) return;
      setStatus(isProfileComplete(profile) ? "ready" : "missing");
    });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  if (status === "loading") {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (status === "missing") {
    return <Navigate to="/compte" replace />;
  }

  return children;
}
