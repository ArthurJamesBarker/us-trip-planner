const TRIP_ID_KEY = "tripId";

export function getSavedTripId() {
  return localStorage.getItem(TRIP_ID_KEY);
}

export function saveTripId(id) {
  localStorage.setItem(TRIP_ID_KEY, id);
}

export function clearTripId() {
  localStorage.removeItem(TRIP_ID_KEY);
}

function ratingsKey(tripId) {
  return `tripRatings_${tripId}`;
}

export function getLocalRatings(tripId) {
  try {
    return JSON.parse(localStorage.getItem(ratingsKey(tripId)) || "{}");
  } catch {
    return {};
  }
}

export function saveLocalRating(tripId, itemId, user, rating) {
  const all = getLocalRatings(tripId);
  if (!all[itemId]) all[itemId] = {};
  const key = user === "dad" ? "dad" : "arthur";
  if (rating === 0) {
    delete all[itemId][key];
    if (Object.keys(all[itemId]).length === 0) delete all[itemId];
  } else {
    all[itemId][key] = rating;
  }
  localStorage.setItem(ratingsKey(tripId), JSON.stringify(all));
}

export function mergeLocalRatings(tripId, items) {
  const local = getLocalRatings(tripId);
  return items.map((item) => {
    const saved = local[item.id];
    if (!saved) return item;
    return {
      ...item,
      rating_me: Math.max(item.rating_me ?? 0, saved.arthur ?? 0),
      rating_dad: Math.max(item.rating_dad ?? 0, saved.dad ?? 0)
    };
  });
}

export function getPendingRatingSyncs(tripId, items) {
  const local = getLocalRatings(tripId);
  const pending = [];

  for (const item of items) {
    const saved = local[item.id];
    if (!saved) continue;

    if ((saved.arthur ?? 0) > (item.rating_me ?? 0)) {
      pending.push({ itemId: item.id, user: "arthur", rating: saved.arthur });
    }
    if ((saved.dad ?? 0) > (item.rating_dad ?? 0)) {
      pending.push({ itemId: item.id, user: "dad", rating: saved.dad });
    }
  }

  return pending;
}
