"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchGuardianFeed } from "@/lib/guardianParser";
import { categorizeAll, EVENT_TYPES } from "@/lib/categorizer";
import { buildArcs } from "@/lib/arcMapper";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + "s";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  return Math.floor(diff / 86400) + "d";
}

function Tag({ label, color }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold"
      style={{
        fontSize: "9px",
        backgroundColor: color + "22",
        color: color,
        border: "1px solid " + color + "55",
      }}
    >
      {label}
    </span>
  );
}

function NewsCard({ article, onHover, isHovered, hasArc, isHighlighted }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block group mb-2"
      onMouseEnter={() => onHover(article.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="rounded-xl overflow-hidden transition-all duration-200 border cursor-pointer"
        style={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
          borderColor: isHovered ? article.eventColor + "99" : "rgba(255,255,255,0.08)",
          boxShadow: isHovered && hasArc ? "0 0 12px " + article.eventColor + "44" : "none",
          animation: isHighlighted ? "card-flash 2s ease-out forwards" : "none",
        }}
      >
        {hasArc && (
          <div
            style={{
              height: "2px",
              background: "linear-gradient(to right, " + article.eventColor + ", transparent)",
            }}
          />
        )}

        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="rounded-full bg-blue-900 flex items-center justify-center text-white font-black shrink-0"
              style={{ width: "24px", height: "24px", fontSize: "8px" }}
            >
              G
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white/90 font-semibold" style={{ fontSize: "11px" }}>The Guardian</span>
              <span className="text-white/40 ml-1" style={{ fontSize: "11px" }}>@guardian</span>
            </div>
            <span className="text-white/30 shrink-0" style={{ fontSize: "11px" }}>{timeAgo(article.pubDate)}</span>
          </div>

          <p
            className="text-white/85 leading-relaxed mb-2 group-hover:text-white transition-colors"
            style={{
              fontSize: "11px",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.title}
          </p>

          <div className="flex flex-wrap gap-1 items-center">
            <Tag label={article.eventType} color={article.eventColor} />
            {(article.countries || []).slice(0, 3).map((c) => (
              <Tag key={c.name} label={c.short} color="#999999" />
            ))}
            {hasArc && (
              <span
                className="ml-auto shrink-0"
                title="Mapped on globe"
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: article.eventColor,
                  boxShadow: `0 0 5px ${article.eventColor}, 0 0 10px ${article.eventColor}66`,
                  animation: "led-pulse 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function NewsFeed({ onArcsReady, onHover, hoveredId, arcClickEvent }) {
  const today = new Date().toISOString().split("T")[0];
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [arcIds, setArcIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState(null);
  const [mapFilter, setMapFilter] = useState("all"); // "all" | "mapped" | "unmapped"
  const [fromDate, setFromDate] = useState("2026-03-01");
  const [toDate, setToDate] = useState(today);
  const [highlightedId, setHighlightedId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const cardRefs = useRef({});
  const pendingScrollIdRef = useRef(null);
  const consumedNonceRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const raw = await fetchGuardianFeed(fromDate, toDate);
      const categorized = categorizeAll(raw);
      const arcs = buildArcs(categorized);
      const ids = new Set(arcs.map((a) => a.id));
      setArcIds(ids);
      setArticles(categorized);
      setLastUpdated(new Date());
      setError(null);
      if (onArcsReady) onArcsReady(arcs);
    } catch (e) {
      setError("Feed unavailable");
    } finally {
      setLoading(false);
    }
  }, [onArcsReady, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  // Arc click → expand if collapsed, then scroll to card + flash highlight
  useEffect(() => {
    if (!arcClickEvent) return;
    // Guard: ignore re-runs triggered only by isCollapsed toggling after this
    // nonce was already consumed (prevents collapse from re-opening the panel).
    if (arcClickEvent.nonce === consumedNonceRef.current) return;

    if (isCollapsed) {
      // Cards not mounted yet — store target and expand the panel
      pendingScrollIdRef.current = arcClickEvent.id;
      setIsCollapsed(false);
      return; // effect re-fires once isCollapsed flips to false
    }

    // Panel is open — resolve the target (pending from expand, or direct click)
    const targetId = pendingScrollIdRef.current || arcClickEvent.id;
    pendingScrollIdRef.current = null;
    consumedNonceRef.current = arcClickEvent.nonce; // mark this click as handled

    const timer = setTimeout(() => {
      const el = cardRefs.current[targetId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setHighlightedId(targetId);
        setTimeout(() => setHighlightedId(null), 2000);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [arcClickEvent, isCollapsed]);

  const activeEventTypes = EVENT_TYPES.filter((et) =>
    articles.some((a) => a.eventType === et.type)
  );

  const filtered = articles
    .filter((a) => !activeFilter || a.eventType === activeFilter)
    .filter((a) => {
      if (mapFilter === "mapped")   return arcIds.has(a.id);
      if (mapFilter === "unmapped") return !arcIds.has(a.id);
      return true;
    });

  if (isCollapsed) {
    return (
      <button
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-white/50 hover:text-white/80 transition-colors"
        style={{
          background: "rgba(10, 14, 26, 0.55)",
          backdropFilter: "blur(32px) saturate(160%)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Intel Feed"
      >
        {/* Radar/target icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="5"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <line x1="12" y1="3" x2="12" y2="1" strokeWidth="2"/>
          <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2"/>
        </svg>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>INTEL</span>
      </button>
    );
  }

  return (
    <div
      className="absolute left-4 top-4 bottom-4 w-72 max-w-[45vw] z-10 flex flex-col rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: "rgba(10, 14, 26, 0.55)",
        backdropFilter: "blur(32px) saturate(160%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <style>{`
        .feed-scroll::-webkit-scrollbar { width: 4px; }
        .feed-scroll::-webkit-scrollbar-track { background: transparent; }
        .feed-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 9999px; }
        @keyframes led-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes card-flash {
          0%   { box-shadow: 0 0 0 2px white, 0 0 20px rgba(255,255,255,0.5); }
          60%  { box-shadow: 0 0 0 2px white, 0 0 20px rgba(255,255,255,0.2); }
          100% { box-shadow: none; }
        }
      `}</style>

      <div className="px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-white font-bold tracking-wide uppercase" style={{ fontSize: "13px" }}>
                Intel Feed
              </h2>
              {!loading && articles.length > 0 && (
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>
                  {filtered.length !== articles.length
                    ? `${filtered.length} / ${articles.length}`
                    : articles.length}
                </span>
              )}
            </div>
            <p className="text-white/40 mt-0.5" style={{ fontSize: "10px" }}>
              {lastUpdated ? "Updated " + timeAgo(lastUpdated.toISOString()) + " ago" : "Loading\u2026"}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={load}
              className="text-white/40 hover:text-white/80 transition-colors p-1"
              style={{ fontSize: "16px" }}
              title="Refresh"
            >
              &#8635;
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-white/40 hover:text-white/80 transition-colors p-1"
              title="Collapse panel"
            >
              {/* Panel-close icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
                <path d="M14 9l-3 3 3 3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Event type filter chips */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveFilter(null)}
            className="px-2 py-0.5 rounded-full transition-all"
            style={{
              fontSize: "9px",
              fontWeight: 600,
              backgroundColor: activeFilter === null ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
              color: activeFilter === null ? "white" : "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            All
          </button>
          {activeEventTypes.map((et) => (
            <button
              key={et.type}
              onClick={() => setActiveFilter(activeFilter === et.type ? null : et.type)}
              className="px-2 py-0.5 rounded-full transition-all"
              style={{
                fontSize: "9px",
                fontWeight: 600,
                backgroundColor: activeFilter === et.type ? et.color + "33" : "rgba(255,255,255,0.04)",
                color: activeFilter === et.type ? et.color : "rgba(255,255,255,0.4)",
                border: "1px solid " + (activeFilter === et.type ? et.color + "88" : "rgba(255,255,255,0.10)"),
              }}
            >
              {et.type}
            </button>
          ))}
        </div>

        {/* Mapped / Unmapped / All toggle */}
        <div className="flex gap-1 mt-2">
          {["all", "mapped", "unmapped"].map((mode) => (
            <button
              key={mode}
              onClick={() => setMapFilter(mode)}
              className="px-2 py-0.5 rounded-full transition-all capitalize"
              style={{
                fontSize: "9px",
                fontWeight: 600,
                backgroundColor: mapFilter === mode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                color: mapFilter === mode ? "white" : "rgba(255,255,255,0.35)",
                border: "1px solid " + (mapFilter === mode ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"),
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-1 mt-2">
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="flex-1 rounded px-2 text-white/60 hover:border-white/20 focus:outline-none focus:border-white/30"
            style={{
              fontSize: "10px",
              colorScheme: "dark",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              paddingTop: "3px",
              paddingBottom: "3px",
            }}
          />
          <span className="text-white/30 shrink-0" style={{ fontSize: "10px" }}>→</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={today}
            onChange={(e) => setToDate(e.target.value)}
            className="flex-1 rounded px-2 text-white/60 hover:border-white/20 focus:outline-none focus:border-white/30"
            style={{
              fontSize: "10px",
              colorScheme: "dark",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              paddingTop: "3px",
              paddingBottom: "3px",
            }}
          />
        </div>
      </div>

      <div className="feed-scroll flex-1 overflow-y-auto px-3 pt-3">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-red-400/80 text-xs text-center mt-8">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-white/30 text-xs text-center mt-8">No articles match this filter.</p>
        )}
        {!loading && !error && filtered.map((article) => (
          <div key={article.id} ref={(el) => { cardRefs.current[article.id] = el; }}>
            <NewsCard
              article={article}
              onHover={onHover}
              isHovered={hoveredId === article.id}
              hasArc={arcIds.has(article.id)}
              isHighlighted={highlightedId === article.id}
            />
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <p className="text-center text-white/20" style={{ fontSize: "9px" }}>Source: The Guardian API</p>
      </div>
    </div>
  );
}
