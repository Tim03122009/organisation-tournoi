import { fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase";

const LOCAL_DIRECTORY_KEY = "gestion-tournoi-user-directory";

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function readLocalDirectory() {
  try {
    const raw = localStorage.getItem(LOCAL_DIRECTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeEmail).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function addToLocalUserDirectory(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const entries = new Set(readLocalDirectory());
  entries.add(normalized);
  localStorage.setItem(LOCAL_DIRECTORY_KEY, JSON.stringify([...entries]));
}

function isInLocalUserDirectory(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return readLocalDirectory().includes(normalized);
}

export async function ensureUserDirectoryEntry(user) {
  if (!user?.email || user.isDemo) return;

  const email = normalizeEmail(user.email);
  if (!email) return;

  addToLocalUserDirectory(email);

  if (!isFirebaseConfigured || !db) return;

  try {
    await setDoc(
      doc(db, "userDirectory", email),
      {
        email,
        uid: user.uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Index Firestore utilisateur impossible:", err);
  }
}

async function lookupUserInFirestore(email) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const snap = await getDoc(doc(db, "userDirectory", email));
    if (!snap.exists()) return null;
    const data = snap.data() || {};
    return { email, uid: data.uid || "" };
  } catch (err) {
    console.warn("Lecture Firestore userDirectory impossible:", err);
    return null;
  }
}

export async function lookupUserRecord(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const fromDirectory = await lookupUserInFirestore(normalized);
  if (fromDirectory?.uid) {
    addToLocalUserDirectory(normalized);
    return fromDirectory;
  }

  if (fromDirectory) {
    addToLocalUserDirectory(normalized);
  }

  return fromDirectory;
}

async function lookupUserInFirebaseAuth(email) {
  if (!auth) return false;

  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      addToLocalUserDirectory(email);
      if (db) {
        setDoc(doc(db, "userDirectory", email), { email }, { merge: true }).catch(() => {});
      }
      return true;
    }
  } catch (err) {
    console.warn("fetchSignInMethodsForEmail:", err);
  }

  return false;
}

export async function lookupUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  if (!isFirebaseConfigured || !db) {
    return isInLocalUserDirectory(normalized) && normalized !== normalizeEmail("demo@local");
  }

  if (isInLocalUserDirectory(normalized)) {
    return true;
  }

  const record = await lookupUserInFirestore(normalized);
  if (record) {
    addToLocalUserDirectory(normalized);
    return true;
  }

  return lookupUserInFirebaseAuth(normalized);
}

export async function validateAdminEmail(email, currentUserEmail, { skipLookup = false } = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { status: "empty" };
  }

  const current = normalizeEmail(currentUserEmail);
  if (current && normalized === current) {
    return { status: "self", message: "Ça, c'est vous" };
  }

  if (skipLookup) {
    return { status: "valid" };
  }

  const record = await lookupUserRecord(normalized);
  if (!record?.uid) {
    return {
      status: "not_found",
      message: "Aucun utilisateur trouvé pour cette adresse e-mail",
    };
  }

  return { status: "valid" };
}

/** Enregistre l'e-mail du compte connecté (utile si l'index n'a pas encore été créé). */
export function registerCurrentUserEmail(email) {
  addToLocalUserDirectory(email);
}
