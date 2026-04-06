"use client";

import { Component } from "react";

export default class DeckErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (error?.message?.includes("maxTextureDimension2D")) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (error?.message?.includes("maxTextureDimension2D")) {
      return;
    }
    console.error("DeckGL error:", error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}