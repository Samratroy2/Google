import fetch from "node-fetch";

export async function geocode(location) {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      location
    )}&key=${key}`
  );

  const data = await res.json();

  if (!data.results.length) return null;

  return data.results[0].geometry.location;
}