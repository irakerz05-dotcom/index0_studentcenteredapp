import { renderToStaticMarkup } from "react-dom/server";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, Minus, Plus } from "lucide-react";
import { getDisplayRating } from "../data/serviceMetadata.js";
import { getServiceIcon } from "./serviceIcons.jsx";

const CAMPUS_CENTER = [14.60345, 120.98975];

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

function MapFocus({ selectedEstablishment }) {
  const map = useMap();

  useEffect(() => {
    if (selectedEstablishment) {
      map.flyTo([selectedEstablishment.latitude, selectedEstablishment.longitude], 17, {
        animate: true,
        duration: 0.6,
      });
    }
  }, [map, selectedEstablishment]);

  return null;
}

export default function ServiceMap({
  establishments,
  selectedStoreId,
  reviewsByStore,
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
            : CAMPUS_CENTER
        }
        zoom={17}
        minZoom={15}
        scrollWheelZoom
        zoomControl={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus selectedEstablishment={selectedEstablishment} />
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
      </MapContainer>

      <div className="map-controls" aria-hidden="true">
        <button type="button">
          <Plus size={20} />
        </button>
        <button type="button">
          <Minus size={20} />
        </button>
        <button type="button">
          <Crosshair size={20} />
        </button>
      </div>
      <div className="scale-bar" aria-hidden="true">
        <span />
        100 m
      </div>
    </section>
  );
}
