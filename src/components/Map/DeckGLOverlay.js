"use client";

import { DeckGL } from "@deck.gl/react";
import { useEffect, useState } from "react";

export default function DeckGLOverlay({ layers, viewState }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <DeckGL
      viewState={viewState}
      layers={layers}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
}