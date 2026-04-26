export async function geocodeLocation(location) {
  try {
    if (!location) return null;

    // basic cleaning (strip institutions)
    const cleaned = location
      .replace(/techno international|college|school|hospital|building/gi, "")
      .trim();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        cleaned
      )}&key=${key}`
    );

    const data = await res.json();

    if (!data.results || !data.results.length) return null;

    return data.results[0].geometry.location;
  } catch (err) {
    console.error(err);
    return null;
  }
}