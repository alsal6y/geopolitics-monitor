"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchBBCFeed } from "@/lib/rssParser";
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

function NewsCard({ article, onHover, isHovered, hasArc }) {
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
              className="rounded-full bg-red-700 flex items-center justify-center text-white font-black shrink-0"
              style={{ width: "24px", height: "24px", fontSize: "8px" }}
            >
              BBC
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white/90 font-semibold" style={{ fontSize: "11px" }}>BBC News</span>
              <span className="text-white/40 ml-1" style={{ fontSize: "11px" }}>@bbcworld</span>
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
              <span className="ml-auto" style={{ fontSize: "9px", color: article.eventColor + "99" }}>
                &#8965; mapped
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function NewsFeed({ onArcsReady, onHover, hoveredId }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [arcIds, setArcIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState(null);

  const load = useCallback(async () => {
    try {
      const raw = await fetchBBCFeed();
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
  }, [onArcsReady]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const activeEventTypes = EVENT_TYPES.filter((et) =>
    articles.some((a) => a.eventType === et.type)
  );

  const filtered = activeFilter
    ? articles.filter((a) => a.eventType === activeFilter)
    : articles;

  return (
    <div
      className="absolute left-4 top-4 bottom-4 w-72 z-10 flex flex-col rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: "rgba(0,0,0,0.50)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
      }}
    >
      <style>{`
        .feed-scroll::-webkit-scrollbar { width: 4px; }
        .feed-scroll::-webkit-scrollbar-track { background: transparent; }
        .feed-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 9999px; }
      `}</style>

      <div className="px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-bold tracking-wide uppercase" style={{ fontSize: "13px" }}>
              Intel Feed
            </h2>
            <p className="text-white/40 mt-0.5" style={{ fontSize: "10px" }}>
              {lastUpdated ? "Updated " + timeAgo(lastUpdated.toISOString()) + " ago" : "Loading\u2026"}
            </p>
          </div>
          <button
            onClick={load}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
            style={{ fontSize: "16px" }}
            title="Refresh"
          >
            &#8635;
          </button>
        </div>

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
          <NewsCard
            key={article.id}
            article={article}
            onHover={onHover}
            isHovered={hoveredId === article.id}
            hasArc={arcIds.has(article.id)}
          />
        ))}
      </div>

      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <p className="text-center text-white/20" style={{ fontSize: "9px" }}>Source: BBC World News RSS</p>
      </div>
    </div>
  );
}