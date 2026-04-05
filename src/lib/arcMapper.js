const COUNTRY_COORDS = {
  "United States": [-77.0369, 38.9072],
  "Iran": [51.3890, 35.6892],
  "Israel": [34.8516, 31.0461],
  "Gaza": [34.4667, 31.5000],
  "Russia": [37.6173, 55.7558],
  "Ukraine": [30.5238, 50.4547],
  "China": [116.4074, 39.9042],
  "Taiwan": [121.5654, 25.0330],
  "North Korea": [125.7625, 39.0392],
  "South Korea": [126.9780, 37.5665],
  "UK": [-0.1276, 51.5074],
  "France": [2.3522, 48.8566],
  "Germany": [13.4050, 52.5200],
  "Saudi Arabia": [46.6753, 24.6877],
  "Yemen": [44.2075, 15.3694],
  "Lebanon": [35.5018, 33.8938],
  "Syria": [36.2921, 33.5138],
  "Iraq": [44.3661, 33.3152],
  "Pakistan": [73.0479, 33.6844],
  "India": [77.2090, 28.6139],
  "Turkey": [32.8597, 39.9334],
  "Egypt": [31.2357, 30.0444],
  "Libya": [13.1913, 32.8872],
  "Sudan": [32.5599, 15.5007],
  "Somalia": [45.3418, 2.0469],
  "Ethiopia": [38.7578, 9.0320],
  "Nigeria": [7.4951, 9.0579],
  "Venezuela": [-66.9036, 10.4806],
  "Cuba": [-82.3666, 23.1136],
  "Japan": [139.6917, 35.6895],
  "Philippines": [120.9842, 14.5995],
  "Afghanistan": [69.2075, 34.5553],
  "Bahrain": [50.5860, 26.0667],
  "Qatar": [51.5310, 25.2854],
};

export function buildArcs(articles) {
  const arcs = [];
  for (const article of articles) {
    const coords = (article.countries || [])
      .map((c) => COUNTRY_COORDS[c.name])
      .filter(Boolean);

    if (coords.length < 2) continue;

    const color = hexToRgb(article.eventColor || "#888888");
    arcs.push({
      id: article.id,
      source: coords[0],
      target: coords[1],
      color,
      eventType: article.eventType,
    });
  }
  return arcs;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}