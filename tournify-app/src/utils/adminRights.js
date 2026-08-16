export const ALL_RIGHT_IDS = [
  "general",
  "participants",
  "layout",
  "calendar",
  "presentation",
  "presentation_website",
  "presentation_slideshow",
  "presentation_design",
  "scores",
  "scores_phases",
];

export const RIGHT_CHILDREN = {
  presentation: ["presentation_website", "presentation_slideshow", "presentation_design"],
  scores: ["scores_phases"],
};

export const NAV_RIGHTS = {
  general: "general",
  participants: "participants",
  layout: "layout",
  calendar: "calendar",
  presentation: "presentation",
  scores: "scores",
};

export function hasAdminRight(rights, rightId, isOwner = false) {
  if (isOwner) return true;
  const list = Array.isArray(rights) ? rights : [];
  if (!rightId) return true;

  const parentOfChild = Object.entries(RIGHT_CHILDREN).find(([, children]) =>
    children.includes(rightId)
  );

  if (parentOfChild) {
    const [parentId] = parentOfChild;
    return list.includes(parentId) && list.includes(rightId);
  }

  return list.includes(rightId);
}

export function findAdminRecord(admins, user) {
  if (!user) return null;
  const uid = user.uid;
  const email = String(user.email || "").trim().toLowerCase();
  return (
    (admins || []).find(
      (admin) =>
        (uid && admin.uid === uid) ||
        (email && String(admin.email || "").trim().toLowerCase() === email)
    ) || null
  );
}
