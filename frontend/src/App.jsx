import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import HeroPanel from "./components/HeroPanel.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import ServiceMap from "./components/ServiceMap.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import MobileTabs from "./components/MobileTabs.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import AddPlacePanel from "./components/AddPlacePanel.jsx";
import {
  clearSession,
  createBookmark,
  createEstablishment,
  createReview,
  deleteBookmark,
  getSavedSession,
  getBookmarks,
  getEstablishments,
  getReviews,
  login,
  signup,
} from "./services/api.js";
import { getWalkingRoute } from "./services/routing.js";
import {
  clampToUbelt,
  DEFAULT_SERVICE_LOCATION,
} from "./data/mapConfig.js";
import {
  enhanceEstablishment,
  getBackendTypeForCategory,
  matchesCategory,
  sortForStudentMap,
} from "./data/serviceMetadata.js";

const EMPTY_REVIEW = {
  ratingScore: 0,
  reviewText: "",
};

const EMPTY_AUTH_DRAFT = {
  fullName: "",
  email: "",
  password: "",
  school: "",
};

const EMPTY_PLACE_DRAFT = {
  name: "",
  type: "Printing & Binding",
  address: "",
  contact_number: "",
  operating_hours: "",
  price_range: "To verify",
  description: "",
};

const RECENTLY_VIEWED_KEY = "index0_recent_services";

function readRecentlyViewed() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveRecentlyViewed(storeIds) {
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(storeIds));
}

function normalizeSearch(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getSearchTerms(value) {
  const normalizedValue = normalizeSearch(value);
  return normalizedValue ? normalizedValue.split(" ") : [];
}

function getSearchHaystack(establishment) {
  return [
    establishment.name,
    establishment.type,
    establishment.displayCategory,
    establishment.building,
    establishment.building_name,
    establishment.address,
    establishment.contact_number,
    establishment.email,
    establishment.operating_hours,
    establishment.price_range,
    establishment.availability_status,
    establishment.services,
    establishment.keywords,
    establishment.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getLocationFromPosition(position) {
  return clampToUbelt({
    latitude: Number(position.coords.latitude.toFixed(7)),
    longitude: Number(position.coords.longitude.toFixed(7)),
  });
}

function formatAccuracy(position) {
  const accuracy = Math.round(position.coords.accuracy || 0);
  return accuracy > 0 ? `GPS active, accuracy about ${accuracy} m.` : "GPS active.";
}

export default function App() {
  const navigationWatchRef = useRef(null);
  const lastRouteUpdateRef = useRef(0);
  const [session, setSession] = useState(() => getSavedSession());
  const [establishments, setEstablishments] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openOnly, setOpenOnly] = useState(false);
  const [showingBookmarks, setShowingBookmarks] = useState(false);
  const [recentStoreIds, setRecentStoreIds] = useState(() => readRecentlyViewed());
  const [bookmarks, setBookmarks] = useState(() => new Set());
  const [reviewsByStore, setReviewsByStore] = useState({});
  const [reviewDraft, setReviewDraft] = useState(EMPTY_REVIEW);
  const [reviewStatus, setReviewStatus] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authDraft, setAuthDraft] = useState(EMPTY_AUTH_DRAFT);
  const [authStatus, setAuthStatus] = useState("");
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showAddPlacePanel, setShowAddPlacePanel] = useState(false);
  const [placeDraft, setPlaceDraft] = useState(EMPTY_PLACE_DRAFT);
  const [placeStatus, setPlaceStatus] = useState("");
  const [placeLocation, setPlaceLocation] = useState(DEFAULT_SERVICE_LOCATION);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [navigationStatus, setNavigationStatus] = useState("");
  const [mobileView, setMobileView] = useState("map");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviewsForStores = useCallback(async (stores) => {
    const reviewPairs = await Promise.all(
      stores.map(async (store) => {
        try {
          return [store.store_id, await getReviews(store.store_id)];
        } catch {
          return [store.store_id, []];
        }
      }),
    );

    setReviewsByStore(Object.fromEntries(reviewPairs));
  }, []);

  const loadEstablishments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const backendType = getBackendTypeForCategory(selectedCategory);
      let rows = await getEstablishments(backendType);

      if (rows.length === 0 && selectedCategory !== "All") {
        rows = await getEstablishments();
      }

      const rowsWithCoordinates = rows.filter((row) => {
        const latitude = Number(row.latitude);
        const longitude = Number(row.longitude);
        return Number.isFinite(latitude) && Number.isFinite(longitude);
      });
      const sourceRows = rowsWithCoordinates.length > 0 ? rowsWithCoordinates : rows;
      const enhancedRows = sortForStudentMap(sourceRows.map((row, index) => enhanceEstablishment(row, index)));
      setEstablishments(enhancedRows);
      setSelectedStoreId((currentId) =>
        enhancedRows.some((row) => row.store_id === currentId)
          ? currentId
          : enhancedRows[0]?.store_id ?? null,
      );
      await loadReviewsForStores(enhancedRows);
    } catch (requestError) {
      setError(
        `${requestError.message}. Check that the Flask backend is running and that VITE_API_BASE_URL points to it.`,
      );
      setEstablishments([]);
      setSelectedStoreId(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadReviewsForStores, selectedCategory]);

  useEffect(() => {
    loadEstablishments();
  }, [loadEstablishments]);

  useEffect(() => {
    if (!session?.token) {
      setBookmarks(new Set());
      return;
    }

    getBookmarks()
      .then((rows) => setBookmarks(new Set(rows.map((row) => row.store_id))))
      .catch(() => setBookmarks(new Set()));
  }, [session]);

  useEffect(() => {
    setReviewDraft(EMPTY_REVIEW);
    setReviewStatus("");
  }, [selectedStoreId]);

  const filteredEstablishments = useMemo(() => {
    const searchTerms = getSearchTerms(searchTerm);

    return establishments
      .filter((establishment) => matchesCategory(establishment, selectedCategory))
      .filter((establishment) => {
        if (!showingBookmarks) return true;
        return bookmarks.has(establishment.store_id);
      })
      .filter((establishment) => {
        if (!openOnly) return true;
        return establishment.availability_status !== "Busy";
      })
      .filter((establishment) => {
        if (searchTerms.length === 0) return true;
        const haystack = getSearchHaystack(establishment);

        return searchTerms.every((term) => haystack.includes(term));
      });
  }, [bookmarks, establishments, openOnly, searchTerm, selectedCategory, showingBookmarks]);

  const searchSuggestions = useMemo(() => {
    const searchTerms = getSearchTerms(searchTerm);

    if (searchTerms.length === 0) {
      return [];
    }

    return establishments
      .filter((establishment) => {
        const haystack = getSearchHaystack(establishment);
        return searchTerms.every((term) => haystack.includes(term));
      })
      .slice(0, 6);
  }, [establishments, searchTerm]);

  const serviceStats = useMemo(() => {
    const categoryCount = new Set(establishments.map((establishment) => establishment.displayCategory)).size;
    const openServices = establishments.filter(
      (establishment) => establishment.availability_status !== "Busy",
    ).length;

    return {
      totalServices: establishments.length,
      openServices,
      categories: categoryCount,
    };
  }, [establishments]);

  useEffect(() => {
    if (filteredEstablishments.length === 0) return;

    setSelectedStoreId((currentId) =>
      filteredEstablishments.some((establishment) => establishment.store_id === currentId)
        ? currentId
        : filteredEstablishments[0].store_id,
    );
  }, [filteredEstablishments]);

  const selectedEstablishment = useMemo(() => {
    return (
      filteredEstablishments.find((establishment) => establishment.store_id === selectedStoreId) ||
      filteredEstablishments[0] ||
      null
    );
  }, [filteredEstablishments, selectedStoreId]);

  const handleSelectStore = useCallback((storeId) => {
    if (navigationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(navigationWatchRef.current);
      navigationWatchRef.current = null;
    }
    setIsNavigating(false);
    setNavigationRoute(null);
    setNavigationStatus("");
    setSelectedStoreId(storeId);
    setRecentStoreIds((currentIds) => {
      const nextIds = [storeId, ...currentIds.filter((currentId) => currentId !== storeId)].slice(0, 5);
      saveRecentlyViewed(nextIds);
      return nextIds;
    });
    setMobileView("detail");
  }, []);

  const handleSuggestionSelect = useCallback(
    (establishment) => {
      setSearchTerm(establishment.name);
      handleSelectStore(establishment.store_id);
    },
    [handleSelectStore],
  );

  const handleToggleBookmark = useCallback(
    async (storeId) => {
      if (!session?.token) {
        setAuthMode("login");
        setShowAuthPanel(true);
        setReviewStatus("Log in to save bookmarks.");
        return;
      }

      const isBookmarked = bookmarks.has(storeId);
      const nextBookmarks = new Set(bookmarks);

      if (isBookmarked) {
        nextBookmarks.delete(storeId);
      } else {
        nextBookmarks.add(storeId);
      }

      setBookmarks(nextBookmarks);

      try {
        if (isBookmarked) {
          await deleteBookmark(storeId);
        } else {
          await createBookmark(storeId);
        }
      } catch (bookmarkError) {
        setBookmarks(bookmarks);
        setReviewStatus(bookmarkError.message);
      }
    },
    [bookmarks, session],
  );

  const handleAuthSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setAuthStatus("saving");

      try {
        const nextSession =
          authMode === "signup"
            ? await signup(authDraft)
            : await login({ email: authDraft.email, password: authDraft.password });
        setSession(nextSession);
        setAuthDraft(EMPTY_AUTH_DRAFT);
        setAuthStatus("");
        setShowAuthPanel(false);
      } catch (authError) {
        setAuthStatus(authError.message);
      }
    },
    [authDraft, authMode],
  );

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setBookmarks(new Set());
    setShowingBookmarks(false);
  }, []);

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS is not available in this browser.");
      return;
    }

    setLocationStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = getLocationFromPosition(position);
        setUserLocation(nextLocation);
        setLocationStatus(formatAccuracy(position));
      },
      () => {
        setLocationStatus("Allow location access to use GPS navigation.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  const handleOpenAddPlace = useCallback(() => {
    if (!session?.token) {
      setAuthMode("signup");
      setShowAuthPanel(true);
      setAuthStatus("Create an account or log in before adding a service.");
      return;
    }

    setPlaceStatus("");
    setPlaceLocation(userLocation || DEFAULT_SERVICE_LOCATION);
    setShowAddPlacePanel(true);
  }, [session, userLocation]);

  const handleSubmitPlace = useCallback(
    async (event) => {
      event.preventDefault();
      setPlaceStatus("saving");

      try {
        const nextPlaceLocation = clampToUbelt(placeLocation);
        const created = await createEstablishment({
          ...placeDraft,
          latitude: nextPlaceLocation.latitude,
          longitude: nextPlaceLocation.longitude,
        });
        const enhanced = enhanceEstablishment(created, establishments.length);
        setEstablishments((current) => sortForStudentMap([...current, enhanced]));
        setSelectedStoreId(created.store_id);
        setPlaceDraft(EMPTY_PLACE_DRAFT);
        setShowAddPlacePanel(false);
        setMobileView("detail");
        setPlaceStatus("");
      } catch (placeError) {
        setPlaceStatus(placeError.message);
      }
    },
    [establishments.length, placeDraft, placeLocation],
  );

  const handleSubmitReview = useCallback(
    async (event) => {
      event.preventDefault();

      if (!session?.token) {
        setAuthMode("login");
        setShowAuthPanel(true);
        setReviewStatus("Log in to submit a review.");
        return;
      }

      if (!selectedEstablishment) {
        return;
      }

      if (reviewDraft.ratingScore === 0 || reviewDraft.reviewText.trim().length < 3) {
        setReviewStatus("Choose a rating and write a short review.");
        return;
      }

      setReviewStatus("saving");

      try {
        await createReview({
          storeId: selectedEstablishment.store_id,
          ratingScore: reviewDraft.ratingScore,
          reviewText: reviewDraft.reviewText.trim(),
        });
        const nextReviews = await getReviews(selectedEstablishment.store_id);
        setReviewsByStore((current) => ({
          ...current,
          [selectedEstablishment.store_id]: nextReviews,
        }));
        setReviewDraft(EMPTY_REVIEW);
        setReviewStatus("Review submitted.");
      } catch (reviewError) {
        setReviewStatus(reviewError.message);
      }
    },
    [reviewDraft, selectedEstablishment, session],
  );

  const handleBookmarkView = useCallback(() => {
    setShowingBookmarks(true);
    setMobileView("list");
  }, []);

  const detailReviews = selectedEstablishment
    ? reviewsByStore[selectedEstablishment.store_id] || []
    : [];

  const stopNavigationWatch = useCallback(() => {
    if (navigationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(navigationWatchRef.current);
      navigationWatchRef.current = null;
    }
  }, []);

  const handleStopNavigation = useCallback(() => {
    stopNavigationWatch();
    setIsNavigating(false);
    setNavigationRoute(null);
    setNavigationStatus("");
    setLocationStatus("Navigation stopped.");
  }, [stopNavigationWatch]);

  const buildRouteFromLocation = useCallback(
    async (origin) => {
      if (!selectedEstablishment) return;
      lastRouteUpdateRef.current = Date.now();
      setNavigationStatus("Building route...");
      const route = await getWalkingRoute(origin, {
        latitude: selectedEstablishment.latitude,
        longitude: selectedEstablishment.longitude,
      });
      setNavigationRoute(route);
      setNavigationStatus(
        route.provider === "fallback"
          ? "Route service is unavailable. Showing a basic direction line."
          : "Follow the steps below. Stay aware of your surroundings.",
      );
    },
    [selectedEstablishment],
  );

  const handleStartNavigation = useCallback(() => {
    if (!selectedEstablishment) {
      setNavigationStatus("Select a service first.");
      return;
    }

    if (!navigator.geolocation) {
      setNavigationStatus("GPS is not available in this browser.");
      return;
    }

    setMobileView("map");
    setIsNavigating(true);
    setNavigationStatus("Finding your GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = getLocationFromPosition(position);
        setUserLocation(nextLocation);
        setLocationStatus(formatAccuracy(position));
        await buildRouteFromLocation(nextLocation);

        stopNavigationWatch();
        navigationWatchRef.current = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const watchedLocation = getLocationFromPosition(watchPosition);
            setUserLocation(watchedLocation);
            setLocationStatus(formatAccuracy(watchPosition));
            if (Date.now() - lastRouteUpdateRef.current > 15000) {
              buildRouteFromLocation(watchedLocation);
            }
          },
          () => {
            setNavigationStatus("GPS tracking paused. Allow location access to continue navigation.");
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 8000 },
        );
      },
      () => {
        setIsNavigating(false);
        setNavigationStatus("Allow location access to start navigation.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  }, [buildRouteFromLocation, selectedEstablishment, stopNavigationWatch]);

  useEffect(() => {
    return () => stopNavigationWatch();
  }, [stopNavigationWatch]);

  return (
    <div className="app-shell">
      <Header
        user={session?.user}
        isNavigating={isNavigating}
        showingBookmarks={showingBookmarks}
        onToggleBookmarks={() => setShowingBookmarks((value) => !value)}
        onAddPlace={handleOpenAddPlace}
        onStopNavigation={handleStopNavigation}
        onLogin={() => {
          setAuthMode("login");
          setAuthStatus("");
          setShowAuthPanel(true);
        }}
        onLogout={handleLogout}
      />

      <main className={`app-main mobile-${mobileView}`}>
        <HeroPanel
          searchTerm={searchTerm}
          suggestions={searchSuggestions}
          stats={serviceStats}
          onSearchChange={setSearchTerm}
          onSuggestionSelect={handleSuggestionSelect}
          onExplore={() => setMobileView("list")}
          onViewMap={() => setMobileView("map")}
        />

        <section className="workspace-grid" aria-label="Index 0 Student Map workspace">
          <SearchPanel
            establishments={filteredEstablishments}
            allEstablishments={establishments}
            selectedStoreId={selectedEstablishment?.store_id ?? selectedStoreId}
            searchTerm={searchTerm}
            suggestions={searchSuggestions}
            selectedCategory={selectedCategory}
            openOnly={openOnly}
            showingBookmarks={showingBookmarks}
            bookmarks={bookmarks}
            reviewsByStore={reviewsByStore}
            recentStoreIds={recentStoreIds}
            isLoading={isLoading}
            error={error}
            onSearchChange={setSearchTerm}
            onSuggestionSelect={handleSuggestionSelect}
            onCategoryChange={(category) => {
              setSelectedCategory(category);
              setShowingBookmarks(false);
            }}
            onOpenOnlyChange={() => setOpenOnly((value) => !value)}
            onSelectStore={handleSelectStore}
          />

          <ServiceMap
            establishments={filteredEstablishments}
            selectedStoreId={selectedEstablishment?.store_id ?? selectedStoreId}
            reviewsByStore={reviewsByStore}
            userLocation={userLocation}
            locationStatus={locationStatus}
            navigationRoute={navigationRoute}
            navigationStatus={navigationStatus}
            isNavigating={isNavigating}
            onLocateUser={handleLocateUser}
            onStopNavigation={isNavigating ? handleStopNavigation : undefined}
            onSelectStore={handleSelectStore}
          />

          <DetailPanel
            establishment={selectedEstablishment}
            reviews={detailReviews}
            isBookmarked={selectedEstablishment ? bookmarks.has(selectedEstablishment.store_id) : false}
            reviewDraft={reviewDraft}
            reviewStatus={reviewStatus}
            userLocation={userLocation}
            isAuthenticated={Boolean(session?.token)}
            isNavigating={isNavigating}
            navigationStatus={navigationStatus}
            onClose={() => setMobileView("map")}
            onToggleBookmark={handleToggleBookmark}
            onStartNavigation={handleStartNavigation}
            onStopNavigation={handleStopNavigation}
            onReviewDraftChange={setReviewDraft}
            onSubmitReview={handleSubmitReview}
          />
        </section>
      </main>

      <MobileTabs
        activeView={mobileView}
        onViewChange={setMobileView}
        onBookmarksView={handleBookmarkView}
      />

      {showAuthPanel ? (
        <AuthPanel
          mode={authMode}
          draft={authDraft}
          status={authStatus}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthStatus("");
          }}
          onDraftChange={setAuthDraft}
          onSubmit={handleAuthSubmit}
          onClose={() => setShowAuthPanel(false)}
        />
      ) : null}

      {showAddPlacePanel ? (
        <AddPlacePanel
          draft={placeDraft}
          status={placeStatus}
          location={placeLocation}
          userLocation={userLocation}
          onDraftChange={setPlaceDraft}
          onLocationChange={(location) => setPlaceLocation(clampToUbelt(location))}
          onUseUserLocation={() => {
            if (userLocation) {
              setPlaceLocation(clampToUbelt(userLocation));
            }
          }}
          onSubmit={handleSubmitPlace}
          onClose={() => setShowAddPlacePanel(false)}
        />
      ) : null}
    </div>
  );
}
