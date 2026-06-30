export const USER_ID = 1;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
      user_id: USER_ID,
      store_id: storeId,
      rating_score: ratingScore,
      review_text: reviewText,
    }),
  });
}

export function getBookmarks() {
  return apiFetch(`/api/users/${USER_ID}/bookmarks`);
}

export function createBookmark(storeId) {
  return apiFetch("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify({
      user_id: USER_ID,
      store_id: storeId,
    }),
  });
}

export function deleteBookmark(storeId) {
  return apiFetch(`/api/bookmarks/${USER_ID}/${storeId}`, {
    method: "DELETE",
  });
}
