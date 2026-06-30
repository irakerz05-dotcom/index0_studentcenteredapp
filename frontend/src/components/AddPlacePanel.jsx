import { Crosshair, MapPin, X } from "lucide-react";
import { CATEGORY_DEFINITIONS } from "../data/serviceMetadata.js";

const CATEGORIES = CATEGORY_DEFINITIONS.filter((category) => category.id !== "All");

export default function AddPlacePanel({
  draft,
  status,
  userLocation,
  onDraftChange,
  onUseLocation,
  onSubmit,
  onClose,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel add-place-panel" aria-label="Add service">
        <button className="panel-close modal-close" type="button" aria-label="Close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-heading">
          <MapPin size={24} />
          <div>
            <h2>Add a Service</h2>
            <p>Student-submitted places appear as needs verification.</p>
          </div>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            <span>Name</span>
            <input
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              placeholder="Shop or service name"
              required
            />
          </label>
          <label>
            <span>Type</span>
            <select
              value={draft.type}
              onChange={(event) => onDraftChange({ ...draft, type: event.target.value })}
              required
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.backendType || category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Address</span>
            <input
              value={draft.address}
              onChange={(event) => onDraftChange({ ...draft, address: event.target.value })}
              placeholder="Street, building, or landmark"
              required
            />
          </label>

          <div className="coordinate-grid">
            <label>
              <span>Latitude</span>
              <input
                value={draft.latitude}
                onChange={(event) => onDraftChange({ ...draft, latitude: event.target.value })}
                placeholder="14.6049"
                required
              />
            </label>
            <label>
              <span>Longitude</span>
              <input
                value={draft.longitude}
                onChange={(event) => onDraftChange({ ...draft, longitude: event.target.value })}
                placeholder="120.9870"
                required
              />
            </label>
          </div>
          <button className="secondary-action" type="button" onClick={onUseLocation} disabled={!userLocation}>
            <Crosshair size={16} />
            <span>{userLocation ? "Use My GPS Location" : "GPS location not available"}</span>
          </button>

          <label>
            <span>Contact number</span>
            <input
              value={draft.contact_number}
              onChange={(event) => onDraftChange({ ...draft, contact_number: event.target.value })}
              placeholder="Optional"
            />
          </label>
          <label>
            <span>Hours</span>
            <input
              value={draft.operating_hours}
              onChange={(event) => onDraftChange({ ...draft, operating_hours: event.target.value })}
              placeholder="Example: 8:00 AM - 8:00 PM"
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
              placeholder="What services do they offer?"
              rows={3}
            />
          </label>

          <button className="primary-action" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Submitting..." : "Submit Service"}
          </button>
          {status && status !== "saving" ? <p className="form-status">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}
