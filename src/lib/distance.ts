export type Coordinates = { lat: number; lng: number };

export const ACADIANA_CITY_COORDS: Record<string, Coordinates> = {
  Lafayette: { lat: 30.2241, lng: -92.0198 },
  Broussard: { lat: 30.1466, lng: -91.9613 },
  Youngsville: { lat: 30.0988, lng: -91.9899 },
  Scott: { lat: 30.236, lng: -92.0946 },
  "Breaux Bridge": { lat: 30.2735, lng: -91.8993 },
  Opelousas: { lat: 30.5335, lng: -91.9835 },
  "New Iberia": { lat: 30.0035, lng: -91.8188 },
  Abbeville: { lat: 29.9746, lng: -92.1343 },
  Crowley: { lat: 30.2141, lng: -92.4438 },
  Rayne: { lat: 30.2346, lng: -92.2682 },
  Carencro: { lat: 30.3174, lng: -92.049 },
  Eunice: { lat: 30.4944, lng: -92.4177 },
  Henderson: { lat: 30.3141, lng: -91.7899 },
};

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMiles(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

export function getNearestAcadianaCity(lat: number, lng: number) {
  const current = { lat, lng };
  const entries = Object.entries(ACADIANA_CITY_COORDS).map(([city, coords]) => ({
    city,
    ...coords,
    miles: haversineMiles(current, coords),
  }));

  entries.sort((a, b) => a.miles - b.miles);
  return entries[0];
}

export function getCityCoordinates(city?: string | null): Coordinates | null {
  if (!city) return null;
  return ACADIANA_CITY_COORDS[city] ?? null;
}

export function sortByDistance<T>(
  items: T[],
  userLat: number,
  userLng: number,
  getCoords: (item: T) => Coordinates | null
): Array<T & { distanceMiles: number | null }> {
  return items
    .map((item) => {
      const coords = getCoords(item);
      return {
        ...item,
        distanceMiles: coords ? haversineMiles({ lat: userLat, lng: userLng }, coords) : null,
      };
    })
    .sort((a, b) => {
      if (a.distanceMiles === null && b.distanceMiles === null) return 0;
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
}
