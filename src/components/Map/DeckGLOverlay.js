"use client";

import { DeckGL } from "@deck.gl/react";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";

const DeckGLOverlay = forwardRef(function DeckGLOverlay({ layers, viewState }, ref) {
  const [ready, setReady] = useState(false);
  const deckRef = useRef(null);

  useEffect(() => {
    setReady(true);
  }, []);

  useImperativeHandle(ref, () => ({
    pickObject: (params) => deckRef.current?.pickObject(params),
  }));

  if (!ready) return null;

  return (
    <DeckGL
      ref={deckRef}
      viewState={viewState}
      layers={layers}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
});

export default DeckGLOverlay;
