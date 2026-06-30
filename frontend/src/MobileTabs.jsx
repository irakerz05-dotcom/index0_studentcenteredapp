import {
  Bookmark,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react";
import { getDisplayRating } from "../data/serviceMetadata.js";
import { ServiceIcon } from "./serviceIcons.jsx";

export default function DetailPanel({
  establishment,
  reviews,
  isBookmarked,
  reviewDraft,
  reviewStatus,
  userLocation,
  isAuthenticated,
  isNavigating,
  navigationStatus,
  onClose,
  onToggleBookmark,
  onStartNavigation,
  onStopNavigation,
  onReviewDraftChange,
  onSubmitReview,
}) {
  if (!establishment) {
    return (
      <aside className="detail-panel empty-detail" aria-label="Establishment details">
        <div>
          <MapPin size={34} />
          <strong>Select a service</strong>
          <span>Choose a place from the list or map to view hours, contact details, reviews, and bookmarks.</span>
        </div>
      </aside>
    );
  }

  const rating = getDisplayRating(establishment, reviews);
  const directionsUrl = userLocation
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${userLocation.latitude}%2C${userLocation.longitude}%3B${establishment.latitude}%2C${establishment.longitude}`
    : `https://www.openstreetmap.org/directions?to=${establishment.latitude}%2C${establishment.longitude}`;

  return (
    <aside className="detail-panel" aria-label={`${establishment.name} details`}>
      <div className="detail-drag" aria-hidden="true" />
      <button className="panel-close" type="button" aria-label="Close details" onClick={onClose}>
        <X size={20} />
      </button>

      <div className="detail-heading">
        <span className="service-tile large" style={{ "--service-color": establishment.color }}>
          <ServiceIcon category={establishment.displayCategory} size={36} strokeWidth={2} />
        </span>
        <div>
          <h1>{establishment.name}</h1>
          <p>
            <Star className="star-fill" size={16} />
            <strong>{rating.rating}</strong>
            <span>({rating.count} reviews)</span>
          </p>
          <p>
            {establishment.displayCategory} <span className="dot" /> {establishment.price_range || "$"}
          </p>
        </div>
        <button
          className={`bookmark-button ${isBookmarked ? "is-active" : ""}`}
          type="button"
          onClick={() => onToggleBookmark(establishment.store_id)}
          aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
        >
          <Bookmark size={22} />
        </button>
      </div>

      <div className="open-line">
        <strong className={establishment.availability_status === "Busy" ? "status-busy" : "status-open"}>
          {establishment.availability_status}
        </strong>
        <span>{establishment.closesAt}</span>
      </div>

      <section className="detail-section">
        <h2>Address</h2>
        <p className="icon-line">
          <MapPin size={17} />
          <span>{establishment.address}</span>
        </p>
        <a className="text-action" href={directionsUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          <span>{userLocation ? "Navigate from my location" : "Directions"}</span>
        </a>
        <button
          className="text-action route-button"
          type="button"
          onClick={isNavigating ? onStopNavigation : onStartNavigation}
        >
          <Navigation size={16} />
          <span>{isNavigating ? "Stop GPS navigation" : "Start GPS navigation"}</span>
        </button>
        {navigationStatus ? <p className="route-note">{navigationStatus}</p> : null}
      </section>

      <section className="detail-section">
        <h2>Contact</h2>
        <p className="icon-line">
          <Phone size={17} />
          {establishment.contact_number ? (
            <a href={`tel:${establishment.contact_number}`}>{establishment.contact_number}</a>
          ) : (
            <span>Contact to verify</span>
          )}
        </p>
        {establishment.email ? (
          <p className="icon-line">
            <Mail size={17} />
            <a href={`mailto:${establishment.email}`}>{establishment.email}</a>
          </p>
        ) : null}
      </section>

      <section className="detail-section hours-grid">
        <h2>Hours</h2>
        <p>
          <Clock size={17} />
          <span>Today</span>
          <strong>{establishment.operating_hours || "Hours not listed"}</strong>
        </p>
      </section>

      <section className="detail-section">
        <h2>Price Range</h2>
        <p className="price-line">
          <span>{establishment.price_range || "$"}</span>
          <strong>{establishment.price_range === "$$" ? "Moderate" : "Affordable"}</strong>
        </p>
        <p className="description-copy">{establishment.description}</p>
      </section>

      <section className="review-section">
        <div className="section-title-row">
          <h2>Reviews ({rating.count})</h2>
          <button type="button">See all</button>
        </div>

        {reviews.slice(0, 2).map((review) => (
          <article className="review-card" key={review.review_id}>
            <p>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={index < Number(review.rating_score) ? "star-fill" : ""}
                  size={14}
                />
              ))}
            </p>
            <span>{review.review_text || "No review text provided."}</span>
          </article>
        ))}

        <form className="review-form" onSubmit={onSubmitReview}>
          <label htmlFor="review-text">Write a review</label>
          {!isAuthenticated ? <p className="form-note">Log in to submit reviews and save bookmarks.</p> : null}
          <div className="rating-input" aria-label="Choose rating">
            {Array.from({ length: 5 }, (_, index) => {
              const score = index + 1;
              return (
                <button
                  key={score}
                  className={score <= reviewDraft.ratingScore ? "is-active" : ""}
                  type="button"
                  onClick={() => onReviewDraftChange({ ...reviewDraft, ratingScore: score })}
                  aria-label={`${score} star rating`}
                >
                  <Star size={19} />
                </button>
              );
            })}
          </div>
          <textarea
            id="review-text"
            value={reviewDraft.reviewText}
            onChange={(event) =>
              onReviewDraftChange({ ...reviewDraft, reviewText: event.target.value })
            }
            placeholder="Share your experience..."
            rows={4}
          />
          <button className="submit-review" type="submit" disabled={!isAuthenticated || reviewStatus === "saving"}>
            {reviewStatus === "saving" ? "Submitting..." : "Submit Review"}
          </button>
          {reviewStatus && reviewStatus !== "saving" ? <p className="form-status">{reviewStatus}</p> : null}
        </form>
      </section>
    </aside>
  );
}
