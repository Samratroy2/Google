// src/utils/geocodingHelper.js

/**
 * Geocodes a location string using the Google Maps Geocoding API.
 * Returns { lat, lng } or null if it fails.
 * Requires window.google to be loaded (call after useGoogleMaps resolves).
 */
export async function geocodeAddress(address) {
  if (!address || !window.google?.maps) return null;

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        console.warn(`Geocoding failed for "${address}":`, status);
        resolve(null);
      }
    });
  });
}

/**
 * Enriches an array of needs with lat/lng if missing.
 * Call this once after fetching needs from Firestore.
 */
export async function enrichNeedsWithCoords(needs) {
  const enriched = await Promise.all(
    needs.map(async (n) => {
      if (n.lat && n.lng) return n;
      if (!n.location) return n;
      const coords = await geocodeAddress(n.location);
      return coords ? { ...n, ...coords } : n;
    }),
  );
  return enriched;
}