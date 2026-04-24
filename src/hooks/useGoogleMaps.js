// src/hooks/useGoogleMaps.js
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES = ['visualization', 'places', 'geometry'];

export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
}