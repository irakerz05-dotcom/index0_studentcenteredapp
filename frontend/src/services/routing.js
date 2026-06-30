function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function actionForStep(step, index, totalSteps) {
  const maneuver = step.maneuver || {};
  const modifier = maneuver.modifier || "";
  const street = step.name ? ` onto ${step.name}` : "";

  if (maneuver.type === "arrive" || index === totalSteps - 1) {
    return "Arrive at your destination";
  }

  if (maneuver.type === "depart") {
    return street ? `Start${street}` : "Start walking";
  }

  if (modifier.includes("left")) {
    return `Turn left${street}`;
  }

  if (modifier.includes("right")) {
    return `Turn right${street}`;
  }

  if (modifier === "straight") {
    return street ? `Go straight on ${step.name}` : "Go straight";
  }

  if (maneuver.type === "roundabout") {
    return `Take the roundabout${street}`;
  }

  return street ? `Continue${street}` : "Continue";
}

function normalizeSteps(steps = []) {
  return steps
    .filter((step) => Number(step.distance) > 0 || step.maneuver?.type === "arrive")
    .map((step, index, list) => ({
      id: `${index}-${step.maneuver?.type || "step"}`,
      instruction: actionForStep(step, index, list.length),
      distance: formatDistance(step.distance),
    }));
}

function fallbackRoute(origin, destination) {
  return {
    provider: "fallback",
    coordinates: [
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
    ],
    distanceText: "Route preview",
    durationText: "Open directions for exact timing",
    steps: [
      { id: "start", instruction: "Start from your current location", distance: "" },
      { id: "continue", instruction: "Head toward the selected service", distance: "" },
      { id: "arrive", instruction: "Arrive at your destination", distance: "" },
    ],
  };
}

export async function getWalkingRoute(origin, destination) {
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url);
    const payload = await response.json();
    const route = payload.routes?.[0];

    if (!response.ok || !route?.geometry?.coordinates?.length) {
      throw new Error(payload.message || "Route service unavailable");
    }

    return {
      provider: "osrm",
      coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
      steps: normalizeSteps(route.legs?.flatMap((leg) => leg.steps || []) || []),
    };
  } catch {
    return fallbackRoute(origin, destination);
  }
}
