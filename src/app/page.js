"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <p className="text-cyan-400 text-lg tracking-widest">INITIALIZING...</p>
    </div>
  ),
});

const NewsFeed = dynamic(() => import("@/components/NewsFeed/NewsFeed"), {
  ssr: false,
});

export default function Home() {
  const [arcs, setArcs] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  const handleArcsReady = useCallback((newArcs) => setArcs(newArcs), []);
  const handleHover = useCallback((id) => setHoveredId(id), []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <MapView arcs={arcs} hoveredId={hoveredId} />
      <NewsFeed onArcsReady={handleArcsReady} onHover={handleHover} />
    </main>
  );
}