import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

function storageKey(uid) {
  return `gestion-tournoi-profile-${uid}`;
}

export function emptyProfile() {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    club: "",
    completed: false,
  };
}

export function splitDisplayName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function isProfileComplete(profile) {
  return Boolean(
    profile?.completed &&
      String(profile.firstName || "").trim() &&
      String(profile.lastName || "").trim() &&
      String(profile.phone || "").trim()
  );
}

function readLocalProfile(uid) {
  if (!uid) return emptyProfile();
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return emptyProfile();
    return { ...emptyProfile(), ...JSON.parse(raw) };
  } catch {
    return emptyProfile();
  }
}

function writeLocalProfile(uid, profile) {
  if (!uid) return;
  localStorage.setItem(storageKey(uid), JSON.stringify(profile));
}

export async function loadUserProfile(uid) {
  const local = readLocalProfile(uid);
  if (!uid || !isFirebaseConfigured || !db) return local;

  try {
    const snap = await getDoc(doc(db, "users", uid, "data", "profile"));
    if (!snap.exists()) return local;
    const remote = { ...emptyProfile(), ...snap.data() };
    writeLocalProfile(uid, remote);
    return remote;
  } catch (err) {
    console.warn("Lecture du profil impossible:", err);
    return local;
  }
}

export async function saveUserProfile(uid, profile) {
  const next = {
    ...emptyProfile(),
    ...profile,
    firstName: String(profile.firstName || "").trim(),
    lastName: String(profile.lastName || "").trim(),
    phone: String(profile.phone || "").trim(),
    club: String(profile.club || "").trim(),
    completed: true,
    updatedAt: Date.now(),
  };
  writeLocalProfile(uid, next);

  if (uid && isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", uid, "data", "profile"), next);
  }

  return next;
}
