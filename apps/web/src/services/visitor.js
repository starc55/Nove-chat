const VISITOR_KEY = "xion_visitor_id";
const PROFILE_KEY = "xion_visitor_profile";

// Preserve existing customer/chat identity during the brand migration.
for (const [current, previous] of [[VISITOR_KEY, "nova_visitor_id"], [PROFILE_KEY, "nova_visitor_profile"]]) {
  try {
    const legacy = localStorage.getItem(previous);
    if (!localStorage.getItem(current) && legacy) localStorage.setItem(current, legacy);
  } catch { /* Storage may be restricted by the browser. */ }
}

export function getVisitorId() {
  const current = localStorage.getItem(VISITOR_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, created);
  return created;
}

export function getVisitorProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; }
}

export function saveVisitorProfile(profile) {
  const value = { name: profile.name.trim(), phone: profile.phone.trim() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
  return value;
}
