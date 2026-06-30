const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SESSION_STORAGE_KEY = "student_services_session";

export function getSavedSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getCurrentUserId() {
  return getSavedSession()?.user?.user_id ?? null;
}

async function apiFetch(path, options = {}) {
  const session = getSavedSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function signup({ fullName, email, password, school }) {
  const session = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      school,
    }),
  });
  saveSession(session);
  return session;
}

export async function login({ email, password }) {
  const session = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(session);
  return session;
}

export function getMe() {
  return apiFetch("/api/me");
}

export function getEstablishments(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetch(`/api/establishments${query}`);
}

export function getEstablishment(storeId) {
  return apiFetch(`/api/establishments/${storeId}`);
}

export function getReviews(storeId) {
  return apiFetch(`/api/establishments/${storeId}/reviews`);
}

export function createReview({ storeId, ratingScore, reviewText }) {
  return apiFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      store_id: storeId,
      rating_score: ratingScore,
      review_text: reviewText,
    }),
  });
}

export function getBookmarks() {
  const userId = getCurrentUserId();
  if (!userId) return Promise.resolve([]);
  return apiFetch(`/api/users/${userId}/bookmarks`);
}

export function createBookmark(storeId) {
  return apiFetch("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify({
      store_id: storeId,
    }),
  });
}

export function deleteBookmark(storeId) {
  const userId = getCurrentUserId();
  if (!userId) return Promise.reject(new Error("Login required"));
  return apiFetch(`/api/bookmarks/${userId}/${storeId}`, {
    method: "DELETE",
  });
}

export function createEstablishment(payload) {
  return apiFetch("/api/establishments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
