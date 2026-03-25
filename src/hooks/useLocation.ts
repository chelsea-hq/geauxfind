"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ACADIANA_CITY_COORDS, getNearestAcadianaCity } from "@/lib/distance";

type SavedLocation = {
  lat: number;
  lng: number;
  city: string;
  savedAt: number;
};

const STORAGE_KEY = "geauxfind:user-location";
const FALLBACK = {
  lat: ACADIANA_CITY_COORDS.Lafayette.lat,
  lng: ACADIANA_CITY_COORDS.Lafayette.lng,
  city: "Lafayette",
};

export function useLocation() {
  const [lat, setLat] = useState<number>(FALLBACK.lat);
  const [lng, setLng] = useState<number>(FALLBACK.lng);
  const [city, setCity] = useState<string>(FALLBACK.city);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveLocation = useCallback((nextLat: number, nextLng: number) => {
    const nearest = getNearestAcadianaCity(nextLat, nextLng);
    const nextCity = nearest?.city ?? FALLBACK.city;

    setLat(nextLat);
    setLng(nextLng);
    setCity(nextCity);
    setError(null);

    const payload: SavedLocation = {
      lat: nextLat,
      lng: nextLng,
      city: nextCity,
      savedAt: Date.now(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission denied. Using Lafayette by default."
            : "Couldn't get your location. Using Lafayette by default."
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 1000 * 60 * 10 }
    );
  }, [saveLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SavedLocation;
      if (typeof saved.lat === "number" && typeof saved.lng === "number" && typeof saved.city === "string") {
        setLat(saved.lat);
        setLng(saved.lng);
        setCity(saved.city);
      }
    } catch {
      // Ignore corrupt localStorage value.
    }
  }, []);

  return useMemo(
    () => ({ lat, lng, city, loading, error, requestLocation }),
    [lat, lng, city, loading, error, requestLocation]
  );
}
