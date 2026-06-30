export const UBELT_CENTER = {
  latitude: 14.60345,
  longitude: 120.98975,
};

export const DEFAULT_SERVICE_LOCATION = {
  latitude: 14.603056,
  longitude: 120.985556,
};

export const UBELT_BOUNDS = {
  south: 14.5958,
  west: 120.9802,
  north: 14.6112,
  east: 120.9985,
};

export const UBELT_LEAFLET_BOUNDS = [
  [UBELT_BOUNDS.south, UBELT_BOUNDS.west],
  [UBELT_BOUNDS.north, UBELT_BOUNDS.east],
];

export function clampToUbelt(location) {
  return {
    latitude: Math.min(Math.max(Number(location.latitude), UBELT_BOUNDS.south), UBELT_BOUNDS.north),
    longitude: Math.min(Math.max(Number(location.longitude), UBELT_BOUNDS.west), UBELT_BOUNDS.east),
  };
}

export function toLatLng(location) {
  return [Number(location.latitude), Number(location.longitude)];
}
