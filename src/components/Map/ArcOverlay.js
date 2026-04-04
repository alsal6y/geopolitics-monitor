"use client";

import { useState, useEffect } from "react";
import { ArcLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./DeckGLOverlay";

const SAMPLE_ARCS = [
  {
    id: "us-iran",
    source: [-77.0369, 38.9072],
    target: [51.3890, 35.6892],
    sourceColor: [0, 200, 255],
    targetColor: [255, 50, 50],
  },
  {
    id: "uk-yemen",
    source: [-0.1276, 51.5074],
    target: [44.2075, 15.3694],
    sourceColor: [0, 200, 255],
    targetColor: [255, 150, 0],
  },
  {
    id: "iran-bahrain",
    source: [51.3890, 35.6892],
    target: [50.5860, 26.0667],
    sourceColor: [255, 50, 50],
    targetColor: [255, 200, 0],
  },
];

export default function ArcOverlay({ viewState }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 500);
    return () => clearTimeout(timer);
  }, []);

  const arcLayer = new ArcLayer({
    id: "arc-layer",
    data: SAMPLE_ARCS,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getSourceColor: (d) => d.sourceColor,
    getTargetColor: (d) => d.targetColor,
    getWidth: 2,
    getHeight: 0.5,
    opacity: opacity,
    pickable: false,
  });

  return <DeckGLOverlay layers={[arcLayer]} viewState={viewState} />;
}