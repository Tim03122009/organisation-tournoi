import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { normalizeEmail } from "./userLookup";

export function accessDocId(uid, tournamentId) {
  return `${uid}__${tournamentId}`;
}

export function accessDocRef(uid, tournamentId) {
  return doc(db, "tournamentAccess", accessDocId(uid, tournamentId));
}

export function adminIndexFields(admins) {
  const emails = [...new Set((admins || []).map((admin) => normalizeEmail(admin.email)).filter(Boolean))];
  const uids = [...new Set((admins || []).map((admin) => String(admin.uid || "").trim()).filter(Boolean))];
  const coOwnerUids = [...new Set(
    (admins || [])
      .filter((admin) => admin.role === "owner" && admin.uid)
      .map((admin) => String(admin.uid).trim())
  )];
  return { adminEmails: emails, adminUids: uids, coOwnerUids };
}

export function isTournamentCreator(tournament, userId) {
  if (!tournament || !userId) return false;
  if (!tournament.ownerUid) return true;
  return tournament.ownerUid === userId;
}

export function isTournamentOwner(tournament, userId) {
  if (isTournamentCreator(tournament, userId)) return true;
  const coOwners = Array.isArray(tournament?.coOwnerUids)
    ? tournament.coOwnerUids
    : adminIndexFields(tournament?.admins).coOwnerUids;
  return coOwners.includes(userId);
}

export async function writeAdminAccess({ tournamentId, ownerUid, uid, email, role = "admin" }) {
  if (!isFirebaseConfigured || !db || !uid || !tournamentId || !ownerUid) {
    throw new Error("Partage incomplet : identifiant manquant");
  }
  await setDoc(accessDocRef(uid, tournamentId), {
    tournamentId,
    ownerUid,
    uid,
    email: normalizeEmail(email),
    role: "admin",
    updatedAt: Date.now(),
  });
}

export async function deleteAdminAccess(uid, tournamentId) {
  if (!isFirebaseConfigured || !db || !uid || !tournamentId) return;
  await deleteDoc(accessDocRef(uid, tournamentId)).catch(() => {});
}

export async function listAdminAccessForUser(uid) {
  if (!isFirebaseConfigured || !db || !uid) return [];
  const snap = await getDocs(query(collection(db, "tournamentAccess"), where("uid", "==", uid)));
  return snap.docs
    .map((item) => item.data())
    .filter((item) => item.role === "admin" && item.tournamentId && item.ownerUid);
}

export async function deleteAllAccessForTournament(ownerUid, tournamentId) {
  if (!isFirebaseConfigured || !db || !ownerUid || !tournamentId) return;
  const snap = await getDocs(query(collection(db, "tournamentAccess"), where("ownerUid", "==", ownerUid)));
  await Promise.all(
    snap.docs
      .filter((item) => item.data()?.tournamentId === tournamentId)
      .map((item) => deleteDoc(item.ref).catch(() => {}))
  );
}

export async function syncAdminAccessDocs(tournament, previousAdmins = []) {
  if (!tournament?.id || !tournament.ownerUid) return;
  const prevUids = new Set((previousAdmins || []).map((admin) => admin.uid).filter(Boolean));
  const nextAdmins = (tournament.admins || []).filter((admin) => admin.uid);
  const nextUids = new Set(nextAdmins.map((admin) => admin.uid));

  await Promise.all([
    ...nextAdmins
      .filter((admin) => !prevUids.has(admin.uid))
      .map((admin) =>
        writeAdminAccess({
          tournamentId: tournament.id,
          ownerUid: tournament.ownerUid,
          uid: admin.uid,
          email: admin.email,
        })
      ),
    ...[...prevUids]
      .filter((uid) => !nextUids.has(uid))
      .map((uid) => deleteAdminAccess(uid, tournament.id)),
  ]);
}
