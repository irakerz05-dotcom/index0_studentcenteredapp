import {
  Bookmark,
  Filter,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { CATEGORY_DEFINITIONS, getDisplayRating } from "../data/serviceMetadata.js";
import { ServiceIcon } from "./serviceIcons.jsx";

export default function SearchPanel({
  establishments,
  selectedStoreId,
  searchTerm,
  selectedCategory,
  openOnly,
  showingBookmarks,
  bookmarks,
  reviewsByStore,
  isLoading,
  error,
  onSearchChange,
  onCategoryChange,
  onOpenOnlyChange,
  onSelectStore,
}) {
  return (
    <aside className="results-panel" aria-label="Service search and results">
      <div className="search-row">
        <Search className="search-icon" size={20} />
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search printing, computer shops, study hubs..."
          aria-label="Search services"
        />
        <button className="icon-button" type="button" aria-label="Open filters">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="category-tabs" aria-label="Category filters">
        {CATEGORY_DEFINITIONS.map((category) => (
          <button
            key={category.id}
            className={selectedCategory === category.id ? "is-active" : ""}
            type="button"
            onClick={() => onCategoryChange(category.id)}
          >
            {category.id === "All" ? (
              <span className="all-label">All</span>
            ) : (
              <>
                <ServiceIcon category={category.id} size={17} />
                <span>{category.label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="quick-filters">
        <button className={openOnly ? "is-active" : ""} type="button" onClick={onOpenOnlyChange}>
          <Filter size={16} />
          <span>Open now</span>
        </button>
        <button type="button">
          <span className="money-symbol">$</span>
          <span>Price</span>
        </button>
        <button type="button">
          <Star size={16} />
          <span>Rating</span>
        </button>
        <button className="reset-button" type="button" onClick={() => onCategoryChange("All")}>
          Reset
        </button>
      </div>

      <div className="results-meta">
        <span>{isLoading ? "Loading" : `${establishments.length} results`}</span>
        <button type="button">Sort: Distance</button>
      </div>

      <div className="results-list" aria-live="polite">
        {isLoading ? (
          <div className="state-message">
            <Loader2 className="spin" size={20} />
            <span>Loading campus services...</span>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="state-message error">
            <strong>Backend connection needed</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {!isLoading && !error && establishments.length === 0 ? (
          <div className="state-message">
            <strong>No services found</strong>
            <span>Try a different search, category, or bookmark filter.</span>
          </div>
        ) : null}

        {!isLoading &&
          !error &&
          establishments.map((establishment) => {
            const rating = getDisplayRating(establishment, reviewsByStore[establishment.store_id] || []);
            const isSelected = establishment.store_id === selectedStoreId;
            const isBookmarked = bookmarks.has(establishment.store_id);

            return (
              <button
                key={establishment.store_id}
                className={`result-card ${isSelected ? "is-selected" : ""}`}
                type="button"
                onClick={() => onSelectStore(establishment.store_id)}
              >
                <span className="service-tile" style={{ "--service-color": establishment.color }}>
                  <ServiceIcon category={establishment.displayCategory} size={33} strokeWidth={2} />
                </span>
                <span className="result-content">
                  <span className="result-title-row">
                    <strong>{establishment.name}</strong>
                    <span className="result-distance">{establishment.distance}</span>
                  </span>
                  <span className="result-facts">
                    <Star className="star-fill" size={15} />
                    <span>{rating.rating}</span>
                    <span>({rating.count})</span>
                    <span className="dot" />
                    <span>{establishment.displayCategory}</span>
                  </span>
                  <span className="result-status">
                    <span>{establishment.price_range || "$"}</span>
                    <span className={establishment.availability_status === "Busy" ? "status-busy" : "status-open"}>
                      {establishment.availability_status}
                    </span>
                  </span>
                </span>
                {isBookmarked ? <Bookmark className="card-bookmark" size={17} /> : null}
              </button>
            );
          })}
      </div>

      <button className="load-more" type="button">
        <MapPin size={16} />
        <span>{showingBookmarks ? "Showing bookmarked places" : "Showing nearest services"}</span>
      </button>
    </aside>
  );
}
