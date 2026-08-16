import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuthErrorMessage, isExistingAccountError, isUserCancelledAuth } from "../utils/authErrors";
import { normalizeEmail } from "../utils/userLookup";

function GoogleMark() {
  return (
    <svg className="auth-provider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading, login, signup, loginWithGoogle, isFirebaseConfigured } = useAuth();
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

  function afterAuth(isNewAccount) {
    navigate(isNewAccount ? "/compte" : redirectTo, { replace: true });
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const normalizedEmail = normalizeEmail(email);

    try {
      if (mode === "login") {
        await login(normalizedEmail, password);
        afterAuth(false);
      } else {
        try {
          await signup(normalizedEmail, password);
          afterAuth(true);
        } catch (err) {
          if (!isExistingAccountError(err)) throw err;
          try {
            await login(normalizedEmail, password);
            setMode("login");
            afterAuth(false);
          } catch (loginErr) {
            setMode("login");
            throw loginErr;
          }
        }
      }
    } catch (err) {
      if (isExistingAccountError(err)) {
        setMode("login");
      }
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result) {
        afterAuth(Boolean(result.additionalUserInfo?.isNewUser));
      }
    } catch (err) {
      if (!isUserCancelledAuth(err)) {
        setError(getAuthErrorMessage(err, "google"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !isFirebaseConfigured || submitting;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Gestion tournoi</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Connectez-vous pour accéder à votre tournoi."
            : "Créez un compte : un tournoi vierge lui sera associé."}
        </p>

        {!isFirebaseConfigured && (
          <p className="auth-error">
            La connexion cloud n&apos;est pas configurée. Les comptes ne peuvent pas être créés
            ni ouverts.
          </p>
        )}

        <form onSubmit={handleEmailSubmit} className="auth-form">
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
            disabled={disabled}
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
            disabled={disabled}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-contained btn-full" disabled={disabled}>
            {submitting ? "Patientez..." : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        <div className="auth-separator">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="btn-outlined btn-full auth-provider-btn"
          onClick={handleGoogle}
          disabled={disabled}
        >
          <GoogleMark />
          Continuer avec Google
        </button>

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
