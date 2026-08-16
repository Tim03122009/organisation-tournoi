export function getAuthErrorMessage(err, mode = "login") {
  const code = err?.code || "";

  const messages = {
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/user-not-found": "Aucun compte avec cette adresse e-mail.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/email-already-in-use":
      "Cette adresse e-mail est déjà utilisée. Connectez-vous.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-credential":
      "E-mail ou mot de passe incorrect. Vérifiez vos identifiants, ou créez un compte s'il n'existe pas encore.",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/network-request-failed": "Pas de connexion réseau. Vérifiez votre internet.",
    "auth/unauthorized-domain": "Ce domaine n'est pas autorisé pour la connexion.",
    "auth/operation-not-allowed": "Cette méthode de connexion n'est pas activée.",
    "auth/missing-password": "Indiquez un mot de passe.",
    "auth/not-configured":
      "La connexion cloud n'est pas configurée. Impossible de créer ou d'ouvrir un compte.",
    "auth/popup-closed-by-user": "Connexion Google annulée.",
    "auth/cancelled-popup-request": "Connexion Google annulée.",
    "auth/popup-blocked": "La fenêtre Google a été bloquée. Autorisez les pop-ups et réessayez.",
    "auth/account-exists-with-different-credential":
      "Un compte existe déjà avec cet e-mail, via une autre méthode. Connectez-vous avec celle d'origine.",
    "auth/credential-already-in-use": "Ce compte Google est déjà utilisé.",
  };

  if (messages[code]) return messages[code];

  if (mode === "signup") {
    return "Impossible de créer le compte. Réessayez.";
  }

  if (mode === "google") {
    return "Connexion Google impossible. Réessayez.";
  }

  return "Connexion impossible. Réessayez.";
}

export function isExistingAccountError(err) {
  return err?.code === "auth/email-already-in-use";
}

export function isUserCancelledAuth(err) {
  return (
    err?.code === "auth/popup-closed-by-user" ||
    err?.code === "auth/cancelled-popup-request"
  );
}
