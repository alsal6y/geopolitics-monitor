"use client";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { ArcLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./DeckGLOverlay";

const ArcOverlay = forwardRef(function ArcOverlay(
  { viewState, arcs = [], hoveredId = null },
  ref
) {
  const [opacity, setOpacity] = useState(0);
  const deckGLRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 500);
    return () => clearTimeout(timer);
  }, []);

  useImperativeHandle(ref, () => ({
    pickObject: (params) => deckGLRef.current?.pickObject(params),
  }));

  const hasHover = hoveredId !== null;

  const arcLayer = new ArcLayer({
    id: "arc-layer",
    data: arcs,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getSourceColor: (d) => {
      const [r, g, b] = d.color;
      if (!hasHover) return [r, g, b, 200];
      return d.id === hoveredId ? [r, g, b, 255] : [r, g, b, 30];
    },
    getTargetColor: (d) => {
      const [r, g, b] = d.color;
      if (!hasHover) return [r, g, b, 120];
      return d.id === hoveredId ? [r, g, b, 255] : [r, g, b, 20];
    },
    getWidth: (d) => {
      if (!hasHover) return 1.5;
      return d.id === hoveredId ? 3.5 : 0.8;
    },
    getHeight: 0.4,
    opacity: opacity,
    pickable: true,
    updateTriggers: {
      getSourceColor: [hoveredId],
      getTargetColor: [hoveredId],
      getWidth: [hoveredId],
    },
  });

  return <DeckGLOverlay ref={deckGLRef} layers={[arcLayer]} viewState={viewState} />;
});

export default ArcOverlay;
