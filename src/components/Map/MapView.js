"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import ArcOverlay from "./ArcOverlay";
import DeckErrorBoundary from "./DeckErrorBoundary";

const INITIAL_VIEW = {
  longitude: -30,
  latitude: 20,
  zoom: 1.8,
  pitch: 0,
  bearing: 0,
};

export default function MapView({ arcs = [], hoveredId = null, onArcClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const deckRef = useRef(null);
  const onArcClickRef = useRef(onArcClick);
  const [viewState, setViewState] = useState(INITIAL_VIEW);

  // Keep the callback ref current without re-registering the map listener
  useEffect(() => {
    onArcClickRef.current = onArcClick;
  }, [onArcClick]);

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      renderWorldCopies: false,
      minZoom: 0.5,
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

    map.current.on("click", (e) => {
      const { x, y } = e.point;
      const picked = deckRef.current?.pickObject({ x, y, radius: 10 });
      if (onArcClickRef.current) {
        onArcClickRef.current(picked ? (picked.object?.id ?? null) : null);
      }
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
        <ArcOverlay
          ref={deckRef}
          viewState={viewState}
          arcs={arcs}
          hoveredId={hoveredId}
        />
      </DeckErrorBoundary>
    </div>
  );
}
