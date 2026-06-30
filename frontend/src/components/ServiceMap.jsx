import { renderToStaticMarkup } from "react-dom/server";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, Layers, Maximize2, Minus, Navigation, Plus, RotateCcw, Route, Square, X } from "lucide-react";
import { toLatLng, UBELT_CENTER, UBELT_LEAFLET_BOUNDS } from "../data/mapConfig.js";
import { getDisplayRating } from "../data/serviceMetadata.js";
import { getServiceIcon } from "./serviceIcons.jsx";

const TILE_LAYERS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

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

function createClusterIcon(group, selected) {
  const html = renderToStaticMarkup(
    <div className={`map-cluster ${selected ? "is-selected" : ""}`}>
      <strong>{group.establishments.length}</strong>
    </div>,
  );

  return L.divIcon({
    html,
    className: "map-cluster-shell",
    iconSize: selected ? [58, 58] : [48, 48],
    iconAnchor: selected ? [29, 29] : [24, 24],
    popupAnchor: [0, -22],
  });
}

function groupNearbyEstablishments(establishments) {
  const groups = new Map();

  establishments.forEach((establishment) => {
    const key = `${Number(establishment.latitude).toFixed(4)}:${Number(establishment.longitude).toFixed(4)}`;
    const group = groups.get(key) || {
      key,
      latitude: 0,
      longitude: 0,
      establishments: [],
    };

    group.establishments.push(establishment);
    group.latitude += establishment.latitude;
    group.longitude += establishment.longitude;
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    latitude: group.latitude / group.establishments.length,
    longitude: group.longitude / group.establishments.length,
  }));
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

function MapControlButtons({ isNavigating, layer, onLayerToggle, onLocateUser, onStopNavigation }) {
  const map = useMap();

  function handleFullscreen() {
    const container = map.getContainer().closest(".map-region") || map.getContainer();

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }

    container.requestFullscreen?.();
  }

  return (
    <div className="map-controls">
      <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>
        <Plus size={20} />
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>
        <Minus size={20} />
      </button>
      <button type="button" aria-label="Reset map view" onClick={() => map.flyTo(toLatLng(UBELT_CENTER), 17)}>
        <RotateCcw size={19} />
      </button>
      <button type="button" aria-label="Open map fullscreen" onClick={handleFullscreen}>
        <Maximize2 size={19} />
      </button>
      <button type="button" aria-label="Use my location" onClick={onLocateUser}>
        <Crosshair size={20} />
      </button>
      <button type="button" aria-label={`Switch to ${layer === "street" ? "satellite" : "street"} map`} onClick={onLayerToggle}>
        <Layers size={19} />
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
  const [mapLayer, setMapLayer] = useState("street");
  const tileLayer = TILE_LAYERS[mapLayer];
  const selectedEstablishment = establishments.find(
    (establishment) => establishment.store_id === selectedStoreId,
  );
  const markerGroups = useMemo(() => groupNearbyEstablishments(establishments), [establishments]);

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
        <TileLayer key={mapLayer} attribution={tileLayer.attribution} url={tileLayer.url} />
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
        {markerGroups.map((group) => {
          if (group.establishments.length > 1) {
            const selected = group.establishments.some(
              (establishment) => establishment.store_id === selectedStoreId,
            );

            return (
              <Marker
                key={group.key}
                position={[group.latitude, group.longitude]}
                icon={createClusterIcon(group, selected)}
                eventHandlers={{
                  click: () => onSelectStore(group.establishments[0].store_id),
                }}
              >
                <Popup>
                  <strong>{group.establishments.length} services nearby</strong>
                  {group.establishments.slice(0, 5).map((establishment) => (
                    <button
                      className="popup-service-link"
                      key={establishment.store_id}
                      type="button"
                      onClick={() => onSelectStore(establishment.store_id)}
                    >
                      {establishment.name}
                    </button>
                  ))}
                </Popup>
              </Marker>
            );
          }

          const establishment = group.establishments[0];
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
          layer={mapLayer}
          onLayerToggle={() => setMapLayer((currentLayer) => (currentLayer === "street" ? "satellite" : "street"))}
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
