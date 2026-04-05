"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import ArcOverlay from "./ArcOverlay";
import DeckErrorBoundary from "./DeckErrorBoundary";

const INITIAL_VIEW = {
  longitude: 50.5,
  latitude: 26.0,
  zoom: 4.5,
  pitch: 40,
  bearing: 0,
};

export default function MapView({ arcs = [], hoveredId = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW);

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
    });
    map.current.on("move", () => {
      const c = map.current.getCenter();
      setViewState({
        longitude: c.lng,
        latitude: c.lat,
        zoom: map.current.getZoom(),
        pitch: map.current.getPitch(),
        bearing: map.current.getBearing(),
      });
    });
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <DeckErrorBoundary>
        <ArcOverlay viewState={viewState} arcs={arcs} hoveredId={hoveredId} />
      </DeckErrorBoundary>
    </div>
  );
}