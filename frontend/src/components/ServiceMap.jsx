import { renderToStaticMarkup } from "react-dom/server";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, Minus, Navigation, Plus, Route, Square, X } from "lucide-react";
import { toLatLng, UBELT_CENTER, UBELT_LEAFLET_BOUNDS } from "../data/mapConfig.js";
import { getDisplayRating } from "../data/serviceMetadata.js";
import { getServiceIcon } from "./serviceIcons.jsx";

function createMarkerIcon(establishment, selected) {
  const Icon = getServiceIcon(establishment.displayCategory);
  const html = renderToStaticMarkup(
    <div
      className={`map-marker ${selected ? "is-selected" : ""}`}
      style={{ "--marker-color": establishment.color }}
    >
      <Icon size={24} strokeWidth={2.2} />
    </div>,
  );

  return L.divIcon({
    html,
    className: "map-marker-shell",
    iconSize: selected ? [58, 66] : [46, 54],
    iconAnchor: selected ? [29, 62] : [23, 50],
    popupAnchor: [0, -46],
  });
}

function MapFocus({ selectedEstablishment, navigationRoute }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedEstablishment || navigationRoute?.coordinates?.length) return;

    map.flyTo([selectedEstablishment.latitude, selectedEstablishment.longitude], 18, {
      animate: true,
      duration: 0.65,
    });
  }, [
    map,
    navigationRoute,
    selectedEstablishment?.latitude,
    selectedEstablishment?.longitude,
    selectedEstablishment?.store_id,
  ]);

  return null;
}

function RouteFocus({ route, isNavigating }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.coordinates?.length) return;
    map.fitBounds(route.coordinates, {
      animate: true,
      duration: 0.5,
      padding: isNavigating ? [72, 72] : [42, 42],
    });
  }, [isNavigating, map, route]);

  return null;
}

function UserFollow({ isNavigating, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!isNavigating || !userLocation) return;

    map.flyTo([userLocation.latitude, userLocation.longitude], Math.max(map.getZoom(), 18), {
      animate: true,
      duration: 0.45,
    });
  }, [isNavigating, map, userLocation?.latitude, userLocation?.longitude]);

  return null;
}

function createUserIcon() {
  const html = renderToStaticMarkup(
    <div className="user-marker">
      <Navigation size={20} strokeWidth={2.4} />
    </div>,
  );

  return L.divIcon({
    html,
    className: "user-marker-shell",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function MapControlButtons({ isNavigating, onLocateUser, onStopNavigation }) {
  const map = useMap();

  return (
    <div className="map-controls">
      <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>
        <Plus size={20} />
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>
        <Minus size={20} />
      </button>
      <button type="button" aria-label="Use my location" onClick={onLocateUser}>
        <Crosshair size={20} />
      </button>
      {isNavigating && onStopNavigation ? (
        <button
          className="stop-map-control"
          type="button"
          aria-label="Stop GPS navigation"
          onClick={onStopNavigation}
        >
          <Square size={17} fill="currentColor" />
        </button>
      ) : null}
    </div>
  );
}

function NavigationPanel({ route, status, onStopNavigation }) {
  if (!route && !status) return null;
  const nextStep = route?.steps?.find((step) => step.instruction !== "Start walking") || route?.steps?.[0];

  return (
    <div className="navigation-panel" aria-live="polite">
      <div className="navigation-panel-header">
        <span>
          <Route size={18} />
          Navigation
        </span>
        {onStopNavigation ? (
          <button type="button" aria-label="Stop navigation" onClick={onStopNavigation}>
            <X size={17} />
          </button>
        ) : null}
      </div>
      {status ? <p className="navigation-status">{status}</p> : null}
      {route ? (
        <>
          <p className="route-summary">
            <strong>{route.distanceText}</strong>
            <span>{route.durationText}</span>
          </p>
          {nextStep ? (
            <div className="next-step">
              <span>Next</span>
              <strong>{nextStep.instruction}</strong>
              {nextStep.distance ? <small>{nextStep.distance}</small> : null}
            </div>
          ) : null}
          <ol className="route-steps">
            {route.steps.slice(0, 5).map((step) => (
              <li key={step.id}>
                <span>{step.instruction}</span>
                {step.distance ? <small>{step.distance}</small> : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

export default function ServiceMap({
  establishments,
  selectedStoreId,
  reviewsByStore,
  userLocation,
  locationStatus,
  navigationRoute,
  navigationStatus,
  isNavigating,
  onLocateUser,
  onStopNavigation,
  onSelectStore,
}) {
  const selectedEstablishment = establishments.find(
    (establishment) => establishment.store_id === selectedStoreId,
  );

  return (
    <section className="map-region" aria-label="Campus map">
      <MapContainer
        center={
          selectedEstablishment
            ? [selectedEstablishment.latitude, selectedEstablishment.longitude]
            : toLatLng(UBELT_CENTER)
        }
        zoom={17}
        minZoom={15}
        maxBounds={UBELT_LEAFLET_BOUNDS}
        maxBoundsViscosity={0.75}
        scrollWheelZoom
        zoomControl={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus selectedEstablishment={selectedEstablishment} navigationRoute={navigationRoute} />
        <RouteFocus route={navigationRoute} isNavigating={isNavigating} />
        <UserFollow isNavigating={isNavigating} userLocation={userLocation} />
        {navigationRoute?.coordinates?.length ? (
          <Polyline
            positions={navigationRoute.coordinates}
            pathOptions={{ color: "#007c72", weight: 6, opacity: 0.82 }}
          />
        ) : null}
        {userLocation ? (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={createUserIcon()}>
            <Popup>
              <strong>Your location</strong>
              <span>Used for directions and suggested places.</span>
            </Popup>
          </Marker>
        ) : null}
        {establishments.map((establishment) => {
          const selected = establishment.store_id === selectedStoreId;
          const rating = getDisplayRating(establishment, reviewsByStore[establishment.store_id] || []);

          return (
            <Marker
              key={establishment.store_id}
              position={[establishment.latitude, establishment.longitude]}
              icon={createMarkerIcon(establishment, selected)}
              eventHandlers={{
                click: () => onSelectStore(establishment.store_id),
              }}
            >
              <Popup>
                <strong>{establishment.name}</strong>
                <span>{establishment.displayCategory}</span>
                <span>{rating.rating} rating</span>
              </Popup>
            </Marker>
          );
        })}
        <MapControlButtons
          isNavigating={isNavigating}
          onLocateUser={onLocateUser}
          onStopNavigation={onStopNavigation}
        />
      </MapContainer>

      {locationStatus ? <div className="map-location-status">{locationStatus}</div> : null}
      <NavigationPanel
        route={navigationRoute}
        status={navigationStatus}
        onStopNavigation={onStopNavigation}
      />
      <div className="scale-bar" aria-hidden="true">
        <span />
        100 m
      </div>
    </section>
  );
}
