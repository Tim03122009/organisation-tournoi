import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import {
  emptyProfile,
  isProfileComplete,
  loadUserProfile,
  saveUserProfile,
  splitDisplayName,
} from "../utils/userProfile";

export default function PersonalInfoPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) return undefined;

    const fromGoogle = splitDisplayName(user.displayName);
    loadUserProfile(user.uid).then((loaded) => {
      if (cancelled) return;
      setProfile({
        ...emptyProfile(),
        ...loaded,
        firstName: loaded.firstName || fromGoogle.firstName,
        lastName: loaded.lastName || fromGoogle.lastName,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.displayName]);

  function patch(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.phone.trim()) {
      setError("Indiquez votre prénom, votre nom et votre téléphone.");
      return;
    }

    setSubmitting(true);
    try {
      await saveUserProfile(user.uid, profile);
      const displayName = `${profile.firstName.trim()} ${profile.lastName.trim()}`;
      if (user && user.displayName !== displayName) {
        await updateProfile(user, { displayName }).catch(() => {});
      }
      navigate("/tournois", { replace: true });
    } catch (err) {
      console.warn("Sauvegarde du profil impossible:", err);
      setError("Impossible d'enregistrer le profil. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  const canContinue =
    Boolean(profile.firstName.trim()) &&
    Boolean(profile.lastName.trim()) &&
    Boolean(profile.phone.trim());
  const alreadyComplete = isProfileComplete(profile);

  return (
    <div className="tournois-page">
      <header className="tournois-topbar">
        <div className="tournois-brand">tournify</div>
        <div className="tournois-topbar-actions">
          <button
            type="button"
            className="topbar-action"
            onClick={logout}
            title={user?.email || "Compte"}
          >
            <span className="material-icons">person</span>
            <span className="topbar-action-label">Compte</span>
          </button>
        </div>
      </header>

      <main className="auth-page profile-page">
        <div className="auth-card">
          <h1>Informations personnelles</h1>
          <p className="auth-subtitle">
            {alreadyComplete
              ? "Modifiez les informations de votre compte."
              : "Complétez votre profil pour continuer."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="mui-input-label" htmlFor="profile-email">
              E-mail
            </label>
            <input
              id="profile-email"
              type="email"
              className="mui-input"
              value={user?.email || ""}
              disabled
            />

            <label className="mui-input-label" htmlFor="profile-firstname">
              Prénom
            </label>
            <input
              id="profile-firstname"
              type="text"
              className="mui-input"
              value={profile.firstName}
              onChange={(e) => patch("firstName", e.target.value)}
              required
              autoComplete="given-name"
              disabled={submitting}
            />

            <label className="mui-input-label" htmlFor="profile-lastname">
              Nom
            </label>
            <input
              id="profile-lastname"
              type="text"
              className="mui-input"
              value={profile.lastName}
              onChange={(e) => patch("lastName", e.target.value)}
              required
              autoComplete="family-name"
              disabled={submitting}
            />

            <label className="mui-input-label" htmlFor="profile-phone">
              Téléphone
            </label>
            <input
              id="profile-phone"
              type="tel"
              className="mui-input"
              value={profile.phone}
              onChange={(e) => patch("phone", e.target.value)}
              required
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              disabled={submitting}
            />

            <label className="mui-input-label" htmlFor="profile-club">
              Club / organisation
            </label>
            <input
              id="profile-club"
              type="text"
              className="mui-input"
              value={profile.club}
              onChange={(e) => patch("club", e.target.value)}
              autoComplete="organization"
              disabled={submitting}
            />

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="btn-contained btn-full"
              disabled={submitting || !canContinue}
            >
              {submitting ? "Patientez..." : alreadyComplete ? "Enregistrer" : "Continuer"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
