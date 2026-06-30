import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import ServiceMap from "./components/ServiceMap.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import MobileTabs from "./components/MobileTabs.jsx";
import {
  createBookmark,
  createReview,
  deleteBookmark,
  getBookmarks,
  getEstablishments,
  getReviews,
} from "./services/api.js";
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

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

export default function App() {
  const [establishments, setEstablishments] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openOnly, setOpenOnly] = useState(false);
  const [showingBookmarks, setShowingBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => new Set());
  const [reviewsByStore, setReviewsByStore] = useState({});
  const [reviewDraft, setReviewDraft] = useState(EMPTY_REVIEW);
  const [reviewStatus, setReviewStatus] = useState("");
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
    getBookmarks()
      .then((rows) => setBookmarks(new Set(rows.map((row) => row.store_id))))
      .catch(() => setBookmarks(new Set()));
  }, []);

  useEffect(() => {
    setReviewDraft(EMPTY_REVIEW);
    setReviewStatus("");
  }, [selectedStoreId]);

  const filteredEstablishments = useMemo(() => {
    const query = normalizeSearch(searchTerm);

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
        if (!query) return true;
        const haystack = [
          establishment.name,
          establishment.type,
          establishment.displayCategory,
          establishment.address,
          establishment.description,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
  }, [bookmarks, establishments, openOnly, searchTerm, selectedCategory, showingBookmarks]);

  const selectedEstablishment = useMemo(() => {
    return (
      filteredEstablishments.find((establishment) => establishment.store_id === selectedStoreId) ||
      filteredEstablishments[0] ||
      establishments.find((establishment) => establishment.store_id === selectedStoreId) ||
      null
    );
  }, [establishments, filteredEstablishments, selectedStoreId]);

  const handleSelectStore = useCallback((storeId) => {
    setSelectedStoreId(storeId);
    setMobileView("detail");
  }, []);

  const handleToggleBookmark = useCallback(
    async (storeId) => {
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
    [bookmarks],
  );

  const handleSubmitReview = useCallback(
    async (event) => {
      event.preventDefault();

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
    [reviewDraft, selectedEstablishment],
  );

  const handleBookmarkView = useCallback(() => {
    setShowingBookmarks(true);
    setMobileView("list");
  }, []);

  const detailReviews = selectedEstablishment
    ? reviewsByStore[selectedEstablishment.store_id] || []
    : [];

  return (
    <div className="app-shell">
      <Header
        showingBookmarks={showingBookmarks}
        onToggleBookmarks={() => setShowingBookmarks((value) => !value)}
      />

      <main className={`app-main mobile-${mobileView}`}>
        <SearchPanel
          establishments={filteredEstablishments}
          selectedStoreId={selectedEstablishment?.store_id ?? selectedStoreId}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          openOnly={openOnly}
          showingBookmarks={showingBookmarks}
          bookmarks={bookmarks}
          reviewsByStore={reviewsByStore}
          isLoading={isLoading}
          error={error}
          onSearchChange={setSearchTerm}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setShowingBookmarks(false);
          }}
          onOpenOnlyChange={() => setOpenOnly((value) => !value)}
          onSelectStore={handleSelectStore}
        />

        <ServiceMap
          establishments={filteredEstablishments.length > 0 ? filteredEstablishments : establishments}
          selectedStoreId={selectedEstablishment?.store_id ?? selectedStoreId}
          reviewsByStore={reviewsByStore}
          onSelectStore={handleSelectStore}
        />

        <DetailPanel
          establishment={selectedEstablishment}
          reviews={detailReviews}
          isBookmarked={selectedEstablishment ? bookmarks.has(selectedEstablishment.store_id) : false}
          reviewDraft={reviewDraft}
          reviewStatus={reviewStatus}
          onClose={() => setMobileView("map")}
          onToggleBookmark={handleToggleBookmark}
          onReviewDraftChange={setReviewDraft}
          onSubmitReview={handleSubmitReview}
        />
      </main>

      <MobileTabs
        activeView={mobileView}
        onViewChange={setMobileView}
        onBookmarksView={handleBookmarkView}
      />
    </div>
  );
}
