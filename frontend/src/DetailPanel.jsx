import { renderToStaticMarkup } from "react-dom/server";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Crosshair, MapPin, X } from "lucide-react";
import { clampToUbelt, toLatLng, UBELT_LEAFLET_BOUNDS } from "../data/mapConfig.js";
import { CATEGORY_DEFINITIONS } from "../data/serviceMetadata.js";

const CATEGORIES = CATEGORY_DEFINITIONS.filter((category) => category.id !== "All");

function createPickerIcon() {
  const html = renderToStaticMarkup(
    <div className="place-picker-marker">
      <MapPin size={25} strokeWidth={2.4} />
    </div>,
  );

  return L.divIcon({
    html,
    className: "place-picker-marker-shell",
    iconSize: [42, 50],
    iconAnchor: [21, 46],
  });
}

function LocationPickerController({ location, onLocationChange }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.panTo(toLatLng(location), { animate: false });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [location, map]);

  useMapEvents({
    click(event) {
      onLocationChange(
        clampToUbelt({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        }),
      );
    },
  });

  return null;
}

export default function AddPlacePanel({
  draft,
  status,
  location,
  userLocation,
  onDraftChange,
  onLocationChange,
  onUseUserLocation,
  onSubmit,
  onClose,
}) {
  const markerPosition = toLatLng(location);

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

          <div className="place-picker">
            <div>
              <strong>Map location</strong>
              <span>Drag the pin or tap the map to mark the exact spot in U-Belt.</span>
            </div>
            <div className="place-picker-map">
              <MapContainer
                center={markerPosition}
                zoom={17}
                minZoom={15}
                maxBounds={UBELT_LEAFLET_BOUNDS}
                maxBoundsViscosity={0.9}
                scrollWheelZoom
                zoomControl={false}
                className="place-picker-leaflet"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerController location={location} onLocationChange={onLocationChange} />
                <Marker
                  draggable
                  position={markerPosition}
                  icon={createPickerIcon()}
                  eventHandlers={{
                    dragend: (event) => {
                      const nextLocation = event.target.getLatLng();
                      onLocationChange(
                        clampToUbelt({
                          latitude: nextLocation.lat,
                          longitude: nextLocation.lng,
                        }),
                      );
                    },
                  }}
                />
              </MapContainer>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={onUseUserLocation}
              disabled={!userLocation}
            >
              <Crosshair size={16} />
              <span>{userLocation ? "Place pin at my GPS location" : "Use map pin above"}</span>
            </button>
          </div>

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
