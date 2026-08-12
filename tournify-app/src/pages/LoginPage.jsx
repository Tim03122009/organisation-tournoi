import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/tournois";

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const messages = {
        "auth/invalid-email": "Adresse e-mail invalide.",
        "auth/user-not-found": "Aucun compte avec cette adresse e-mail.",
        "auth/wrong-password": "Mot de passe incorrect.",
        "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
        "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
        "auth/invalid-credential": "Identifiants incorrects.",
      };
      setError(messages[err.code] || "Connexion impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Gestion tournoi</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Connectez-vous pour accéder à votre tournoi."
            : "Créez un compte pour sauvegarder votre tournoi dans le cloud."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="mui-input-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="mui-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label className="mui-input-label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="mui-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-contained btn-full" disabled={submitting}>
            {submitting ? "Patientez..." : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        <button
          type="button"
          className="btn-text auth-toggle"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}
