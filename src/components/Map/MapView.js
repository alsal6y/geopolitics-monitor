"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [50.5, 26.0],
      zoom: 4.5,
      pitch: 40,
      bearing: 0,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 w-full h-full"
    />
  );
}