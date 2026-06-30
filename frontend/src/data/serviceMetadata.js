export const CATEGORY_DEFINITIONS = [
  { id: "All", label: "All", backendType: "", keywords: [] },
  {
    id: "Printing",
    label: "Printing",
    backendType: "Printing & Binding",
    keywords: ["printing", "print", "copy", "binding", "bookbinding"],
  },
  {
    id: "Computer Shop",
    label: "Computer Shop",
    backendType: "Computer Shop",
    keywords: ["computer", "tech", "repair", "laptop", "pc"],
  },
  {
    id: "Study Hub",
    label: "Study Hub",
    backendType: "Study Center",
    keywords: ["study", "hub", "center", "wifi", "library"],
  },
  {
    id: "Dormitory",
    label: "Dormitory",
    backendType: "Dormitory",
    keywords: ["dorm", "housing", "supply", "residence", "student dorm"],
  },
];

export const CATEGORY_COLORS = {
  Printing: "#f6b900",
  "Computer Shop": "#00897f",
  "Study Hub": "#2f6fd6",
  Dormitory: "#7a56d8",
  Cafe: "#f47b20",
  Other: "#64748b",
};

const STORE_METADATA = {
  1: {
    latitude: 14.60294,
    longitude: 120.98868,
    distance: "0.3 mi",
    availability_status: "Few seats",
    closesAt: "Closes 10:00 PM",
    categoryOverride: "Study Hub",
  },
  2: {
    latitude: 14.60442,
    longitude: 120.99057,
    distance: "0.2 mi",
    availability_status: "Open now",
    closesAt: "Closes 6:00 PM",
    categoryOverride: "Computer Shop",
  },
  3: {
    latitude: 14.60372,
    longitude: 120.98958,
    distance: "0.1 mi",
    availability_status: "Open now",
    closesAt: "Closes 7:00 PM",
    categoryOverride: "Printing",
  },
  4: {
    latitude: 14.60312,
    longitude: 120.99083,
    distance: "0.4 mi",
    availability_status: "Busy",
    closesAt: "Closes 7:00 PM",
    categoryOverride: "Dormitory",
  },
  5: {
    latitude: 14.60228,
    longitude: 120.98939,
    distance: "0.5 mi",
    availability_status: "Open now",
    closesAt: "Closes 5:00 PM",
    categoryOverride: "Cafe",
  },
};

const DISPLAY_ORDER = {
  Printing: 1,
  "Computer Shop": 2,
  "Study Hub": 3,
  Dormitory: 4,
  Cafe: 5,
};

const FALLBACK_COORDINATES = [
  [14.60372, 120.98958],
  [14.60442, 120.99057],
  [14.60294, 120.98868],
  [14.60312, 120.99083],
  [14.60228, 120.98939],
];

export function getBackendTypeForCategory(categoryId) {
  return CATEGORY_DEFINITIONS.find((category) => category.id === categoryId)?.backendType || "";
}

export function inferDisplayCategory(establishment) {
  const text = `${establishment.name || ""} ${establishment.type || ""} ${establishment.description || ""}`.toLowerCase();
  const matchedCategory = CATEGORY_DEFINITIONS.find((category) =>
    category.keywords.some((keyword) => text.includes(keyword)),
  );

  if (matchedCategory && matchedCategory.id !== "All") {
    return matchedCategory.id;
  }

  if ((establishment.type || "").toLowerCase().includes("cafe")) {
    return "Cafe";
  }

  return STORE_METADATA[establishment.store_id]?.categoryOverride || establishment.type || "Other";
}

export function enhanceEstablishment(establishment, index = 0) {
  const metadata = STORE_METADATA[establishment.store_id] || {};
  const [fallbackLatitude, fallbackLongitude] = FALLBACK_COORDINATES[index % FALLBACK_COORDINATES.length];
  const displayCategory = metadata.categoryOverride || inferDisplayCategory(establishment);
  const databaseLatitude = Number(establishment.latitude);
  const databaseLongitude = Number(establishment.longitude);
  const hasDatabaseCoordinates = Number.isFinite(databaseLatitude) && Number.isFinite(databaseLongitude);
  const databaseAvailability =
    establishment.availability_status && establishment.availability_status !== "Unknown"
      ? establishment.availability_status
      : null;

  return {
    ...establishment,
    latitude: hasDatabaseCoordinates ? databaseLatitude : metadata.latitude ?? fallbackLatitude,
    longitude: hasDatabaseCoordinates ? databaseLongitude : metadata.longitude ?? fallbackLongitude,
    distance: metadata.distance ?? `${Math.max(index + 1, 1) * 0.2} mi`,
    availability_status: databaseAvailability ?? metadata.availability_status ?? "Unknown",
    closesAt: metadata.closesAt ?? "Closes later today",
    email: establishment.email || metadata.email || "",
    displayCategory,
    color: CATEGORY_COLORS[displayCategory] || CATEGORY_COLORS.Other,
    fallbackRating: metadata.rating ?? null,
    fallbackReviewCount: metadata.reviewCount ?? 0,
  };
}

export function sortForStudentMap(establishments) {
  return [...establishments].sort((a, b) => {
    const categoryDifference =
      (DISPLAY_ORDER[a.displayCategory] || 99) - (DISPLAY_ORDER[b.displayCategory] || 99);

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    return a.name.localeCompare(b.name);
  });
}

export function getDisplayRating(establishment, reviews = []) {
  if (reviews.length > 0) {
    const average = reviews.reduce((sum, review) => sum + Number(review.rating_score || 0), 0) / reviews.length;
    return {
      rating: Number(average.toFixed(1)),
      count: reviews.length,
    };
  }

  return {
    rating: establishment.fallbackRating ?? "New",
    count: establishment.fallbackReviewCount ?? 0,
  };
}

export function matchesCategory(establishment, categoryId) {
  if (categoryId === "All") {
    return true;
  }

  return establishment.displayCategory === categoryId;
}
