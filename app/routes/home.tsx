import { useEffect, useState, useCallback } from "react";
import type { Route } from "./+types/home";
import { initDb, getDb } from "~/db.server";
import type { Entry } from "~/db.server";
import { CHARACTER_MAP } from "~/ai.server";

export async function loader({ request }: Route.LoaderArgs) {
  await initDb();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM entries ORDER BY date DESC, created_at DESC"
  );
  return Response.json({ entries: result.rows as Entry[] });
}

export function meta() {
  return [
    { title: "To Dementia and Beyond" },
    { name: "description", content: "Documenting Mike Smithson's intellectual decline since 2023." },
  ];
}

const DONUTS = [
  { id: "rainbow", name: "Rainbow Sprinkles", emoji: "🍩" },
  { id: "pink",    name: "Pink Sprinkles",    emoji: "🍥" },
  { id: "choc",    name: "Chocolate",         emoji: "🟫" },
  { id: "straw",   name: "Strawberry",        emoji: "🎀" },
  { id: "blue",    name: "Blueberry",         emoji: "🫐" },
];

const SECRET_COMBO = ["rainbow", "pink", "choc", "pink", "rainbow"];
const SESSION_KEY = "gazette_unlocked_until";
const TOKEN_KEY = "gazette_token";

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Dad Logic":                   { bg: "#fff3e0", text: "#7B3800", border: "#e87600" },
  "Saw It On Facebook":          { bg: "#fff0f0", text: "#7a0000", border: "#cc2200" },
  "Heard It On The Radio":       { bg: "#f3f0ff", text: "#3a006e", border: "#7c3aed" },
  "Sports Expert (He's Not)":    { bg: "#e8f4e8", text: "#1a4d1a", border: "#2d7a2d" },
  "Golf Nonsense":                { bg: "#e8fff0", text: "#004d1a", border: "#00aa44" },
  "Pop Culture Fossil":           { bg: "#fff0f8", text: "#6e0044", border: "#cc0066" },
  "Technology Confusion":         { bg: "#e8f0ff", text: "#00246e", border: "#1a56cc" },
  "Financial Genius (He's Not)":  { bg: "#f5fff0", text: "#1a4d00", border: "#3d9900" },
  "History According To Mike":    { bg: "#fefbe8", text: "#5c4000", border: "#d4a000" },
  "Food Crime":                   { bg: "#fff5e8", text: "#7a3300", border: "#cc6600" },
  "Classic Mike":                 { bg: "#f5f0e8", text: "#5c4a2a", border: "#8a7055" },
};

const CAT_NICKNAMES: Record<string, string> = {
  "Dad Logic":                   "The Dad Decree",
  "Saw It On Facebook":          "Zuckerberg Told Me",
  "Heard It On The Radio":       "Rush Limbaugh's Ghost",
  "Sports Expert (He's Not)":    "Armchair GM",
  "Golf Nonsense":                "Fairway Fantasies",
  "Pop Culture Fossil":           "1987 Called",
  "Technology Confusion":         "Have You Tried Turning It Off",
  "Financial Genius (He's Not)":  "Wolf of Wrong Street",
  "History According To Mike":    "The Mike Smithson Version",
  "Food Crime":                   "Gordon Ramsay's Nightmare",
  "Classic Mike":                 "Pure Uncut Mike",
};

const TICKER_ITEMS = [
  "BREAKING: MIKE SMITHSON WRONG AGAIN, SOURCES CONFIRM",
  "MIKE DOUBLES DOWN ON INCORRECT STATEMENT",
  "LOCAL MAN REFUSES TO GOOGLE IT",
  "MIKE SMITHSON CONFIDENTLY INCORRECT FOR 3RD TIME THIS WEEK",
  "EXPERTS BAFFLED: HOW DOES HE NOT KNOW THIS",
  "MIKE SEEN ARGUING WITH A WIKIPEDIA PAGE",
  "SOURCES: MIKE HAS NEVER BEEN RIGHT ABOUT SPORTS",
  "MIKE SMITHSON INVENTS NEW FACTS, NATION MOURNS",
  "UPDATE: MIKE STILL HASN'T APOLOGIZED",
  "MIKE EXPLAINS THING HE CLEARLY DOESN'T UNDERSTAND",
  "DEVELOPING: MIKE DOUBLES DOWN AGAIN",
  "MIKE SMITHSON CITES 'A GUY HE KNOWS' AS SOURCE",
  "WITNESS: MIKE SAID IT WITH A STRAIGHT FACE",
  "MIKE SMITHSON WRONG ABOUT GOLF, AGAIN, STILL",
  "REPORT: MIKE'S CONFIDENCE INVERSELY PROPORTIONAL TO ACCURACY",
  "MIKE SMITHSON DISCOVERS FACEBOOK, WORLD SUFFERS",
  "BREAKING: MIKE ARGUES WITH SOMEONE WHO ACTUALLY KNOWS",
  "MIKE SMITHSON EXPLAINS HISTORY, HISTORIANS WEEP",
  "LOCAL MAN CERTAIN THE REFS WERE WRONG",
  "MIKE SMITHSON SEEN POINTING AT MENU LIKE AN EXPERT",
];

function getCatStyle(cat: string) {
  return CAT_COLORS[cat] ?? CAT_COLORS["Classic Mike"];
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const PAGE_SIZE = 8;

export default function Home({ loaderData }: Route.ComponentProps) {
  const [entries, setEntries] = useState<Entry[]>(loaderData.entries ?? []);
  const [unlocked, setUnlocked] = useState(false);
  const [knockProgress, setKnockProgress] = useState<string[]>([]);
  const [knockFlash, setKnockFlash] = useState<"" | "hit" | "miss">("");

  const [entryText, setEntryText] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "err" | "">("");

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const until = localStorage.getItem(SESSION_KEY);
    if (until && Date.now() < parseInt(until)) setUnlocked(true);
  }, []);

  const handleDonutClick = useCallback(async (id: string) => {
    const next = [...knockProgress, id];
    for (let i = 0; i < next.length; i++) {
      if (next[i] !== SECRET_COMBO[i]) {
        setKnockFlash("miss");
        setTimeout(() => setKnockFlash(""), 600);
        setKnockProgress([]);
        return;
      }
    }
    if (next.length === SECRET_COMBO.length) {
      try {
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ knock: "DONUT42" }),
        });
        if (res.ok) {
          const data = await res.json();
          const until = Date.now() + 30 * 60 * 1000;
          localStorage.setItem(SESSION_KEY, String(until));
          localStorage.setItem(TOKEN_KEY, data.token);
          setUnlocked(true);
          setKnockFlash("hit");
          setTimeout(() => setKnockFlash(""), 1000);
          setKnockProgress([]);
        } else {
          setKnockFlash("miss");
          setTimeout(() => setKnockFlash(""), 600);
          setKnockProgress([]);
        }
      } catch {
        setKnockFlash("miss");
        setTimeout(() => setKnockFlash(""), 600);
        setKnockProgress([]);
      }
    } else {
      setKnockProgress(next);
    }
  }, [knockProgress]);

  function lock() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUnlocked(false);
  }

  async function submitEntry() {
    if (submitting) return;
    if (!entryText.trim()) { setStatusMsg("Write something down."); setStatusType("err"); return; }
    if (!entryDate) { setStatusMsg("Pick a date."); setStatusType("err"); return; }
    setSubmitting(true);
    setStatusMsg("Consulting the AI on Mike's latest...");
    setStatusType("");
    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-gazette-token": token },
        body: JSON.stringify({ text: entryText.trim(), date: entryDate }),
      });
      if (res.status === 401) {
        setStatusMsg("Session expired. Unlock again.");
        setStatusType("err");
        lock();
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setEntries((prev) => [data.entry as Entry, ...prev]);
      setEntryText("");
      setEntryDate(todayStr());
      setStatusMsg("Logged. Mike strikes again.");
      setStatusType("ok");
    } catch {
      setStatusMsg("Something went wrong. Try again.");
      setStatusType("err");
    }
    setSubmitting(false);
  }

  async function deleteEntry(id: number) {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    await fetch(`/api/delete/${id}`, {
      method: "POST",
      headers: { "x-gazette-token": token },
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = entries
    .filter((e) => {
      const q = search.toLowerCase();
      return (
        (!q || e.text.toLowerCase().includes(q) || (e.headline ?? "").toLowerCase().includes(q) || (e.category ?? "").toLowerCase().includes(q)) &&
        (!catFilter || e.category === catFilter)
      );
    })
    .slice()
    .sort((a, b) => {
      if (sortOrder === "newest") return a.date < b.date ? 1 : -1;
      return a.date < b.date ? -1 : 1;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageEntries = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allCategories = [...new Set(entries.map((e) => e.category).filter(Boolean))].sort();

  const now = new Date();
  const thisMonthCount = entries.filter((e) => {
    const d = new Date(e.date + "T12:00:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const thisYearCount = entries.filter((e) => new Date(e.date + "T12:00:00").getFullYear() === now.getFullYear()).length;
  const catCounts: Record<string, number> = {};
  entries.forEach((e) => { if (e.category) catCounts[e.category] = (catCounts[e.category] ?? 0) + 1; });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.split(" ")[0] ?? "—";
  const mikeIQ = Math.max(1, 100 - (entries.length * 3));
  const maxCatCount = Math.max(1, ...Object.values(catCounts));
  const tickerText = TICKER_ITEMS.join(" \u00a0•\u00a0 ");

  return (
    <div className="min-h-screen text-[#1a1008] flex flex-col" style={{ fontFamily: "'Bangers', cursive", background: "#fdf3e3" }}>
      <style>{`
        .bangers { font-family: 'Bangers', cursive; letter-spacing: 2px; }
        .patrick { font-family: 'Patrick Hand', cursive; }
        .entry-card:nth-child(3n+1) { border-left-color: #e63900; }
        .entry-card:nth-child(3n+2) { border-left-color: #e68a00; }
        .entry-card:nth-child(3n+3) { border-left-color: #3355cc; }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 60s linear infinite;
        }
        .ticker-segment { white-space: nowrap; padding-right: 60px; }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes flash-green { 0%,100% { background: #3a1f00; } 50% { background: #1a5c1a; } }
        @keyframes flash-red { 0%,100% { background: #3a1f00; } 50% { background: #5c1a1a; } }
        .flash-hit { animation: flash-green 0.8s ease; }
        .flash-miss { animation: flash-red 0.5s ease; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        .cloud-tag { transition: transform 0.15s, box-shadow 0.15s; }
        .cloud-tag:hover { transform: scale(1.08); }
        .cloud-tag.active { box-shadow: 0 0 0 3px #ffd500; }
        .sticker {
          position: absolute;
          top: -14px;
          right: 12px;
          font-size: 32px;
          line-height: 1;
          filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
        }
      `}</style>

      {/* Header */}
      <header
        className={`text-center py-5 px-4 relative select-none border-b-8 border-[#ffd500] ${knockFlash === "hit" ? "flash-hit" : knockFlash === "miss" ? "flash-miss" : ""}`}
        style={{ background: "#3a1f00" }}
      >
        <p className="patrick text-[#ffd500] text-xs tracking-widest mb-1 uppercase">Documenting Mike Smithson's Intellectual Decline Since 2023</p>
        <h1 className="bangers leading-none" style={{ fontSize: "clamp(42px,11vw,84px)", color: "#ffd500", textShadow: "3px 3px 0px #cc2200" }}>
          TO DEMENTIA
        </h1>
        <h1 className="bangers leading-none" style={{ fontSize: "clamp(42px,11vw,84px)", color: "#ff69b4", textShadow: "3px 3px 0px #3355cc" }}>
          AND BEYOND
        </h1>
        <p className="patrick text-[#ffd500] text-sm mt-2 italic">"D'oh." — Mike, eventually</p>

        {!unlocked && (
          <div className="flex gap-3 justify-center mt-4">
            {DONUTS.map((donut, i) => (
              <button
                key={i}
                onClick={() => handleDonutClick(donut.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "clamp(28px, 7vw, 42px)",
                  transition: "transform 0.1s",
                  filter: knockProgress.includes(donut.id) ? "brightness(1.5) drop-shadow(0 0 6px #ffd500)" : "brightness(1)",
                }}
                title={donut.name}
              >
                {donut.emoji}
              </button>
            ))}
          </div>
        )}

        {!unlocked && knockProgress.length > 0 && (
          <div className="flex gap-2 justify-center mt-2">
            {knockProgress.map((id, i) => {
              const donut = DONUTS.find(d => d.id === id);
              return <span key={i} style={{ fontSize: 20 }}>{donut?.emoji}</span>;
            })}
          </div>
        )}

        {unlocked && (
          <button onClick={lock}
            className="absolute top-3 right-3 text-[#aaa] hover:text-[#ff69b4] text-xs bangers tracking-widest border border-[#555] px-2 py-1 rounded">
            LOCK
          </button>
        )}
      </header>

      {/* Ticker */}
      <div style={{ background: "#ffd500", borderBottom: "4px solid #cc2200", overflow: "hidden", padding: "6px 0" }}>
        <div className="ticker-track">
          <span className="ticker-segment bangers" style={{ fontSize: 13, letterSpacing: 2, color: "#3a1f00" }}>
            {tickerText} &nbsp;•&nbsp;
          </span>
          <span className="ticker-segment bangers" style={{ fontSize: 13, letterSpacing: 2, color: "#3a1f00" }}>
            {tickerText} &nbsp;•&nbsp;
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#cc2200] text-white flex flex-wrap justify-around items-center px-4 py-3 gap-3">
        <div className="text-center">
          <span className="block bangers text-4xl leading-none">{entries.length}</span>
          <span className="patrick text-[10px] tracking-wider opacity-90 uppercase">Times Mike Was Wrong</span>
        </div>
        <div className="text-center">
          <span className="block bangers text-4xl leading-none">{thisMonthCount}</span>
          <span className="patrick text-[10px] tracking-wider opacity-90 uppercase">This Month's Damage</span>
        </div>
        <div className="text-center">
          <span className="block bangers text-4xl leading-none">{thisYearCount}</span>
          <span className="patrick text-[10px] tracking-wider opacity-90 uppercase">This Year's Damage</span>
        </div>
        <div className="text-center">
          <span className="block bangers text-3xl leading-none">{topCat}</span>
          <span className="patrick text-[10px] tracking-wider opacity-90 uppercase">Favorite Delusion</span>
        </div>
      </div>

      {/* IQ Meter */}
      <div className="bg-[#fff8e7] border-b-4 border-[#3a1f00] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="bangers text-[#3a1f00] text-sm tracking-widest whitespace-nowrap">MIKE'S EST. IQ</span>
            <div className="flex-1 h-6 bg-[#e0d5c0] rounded-full border-2 border-[#3a1f00] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(2, Math.min(100, mikeIQ))}%`,
                  background: mikeIQ > 70 ? "#3d9900" : mikeIQ > 40 ? "#e68a00" : "#cc2200",
                }}
              />
            </div>
            <span className="bangers text-2xl text-[#cc2200] min-w-[52px] text-right">{mikeIQ}</span>
          </div>
          <p className="patrick text-[11px] text-[#6b5e4a] mt-1 text-center">
            {entries.length === 0 ? "Baseline established. Give it time." :
             mikeIQ > 70 ? "Early signs of chronic wrongness detected." :
             mikeIQ > 55 ? "Significant cognitive decline in progress." :
             mikeIQ > 40 ? "Doctors are concerned. Mike is not." :
             mikeIQ > 20 ? "At this rate, a crayon is smarter." :
             "Medical professionals have been notified."}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3 pb-16 flex-1 w-full">

        {/* Add Entry Form */}
        {unlocked && (
          <div className="mt-5 border-4 border-[#3a1f00] p-4 relative" style={{ background: "#fff8e7", borderRadius: "8px" }}>
            <span className="absolute -top-4 left-3 bg-[#ffd500] text-[#3a1f00] bangers text-sm tracking-widest px-3 py-0.5 border-2 border-[#3a1f00] rounded">
              LOG MIKE'S LATEST BLUNDER
            </span>
            <textarea
              className="w-full border-2 border-[#3a1f00] focus:border-[#cc2200] focus:outline-none p-3 mt-4 resize-y min-h-[90px] text-sm rounded"
              style={{ fontFamily: "'Patrick Hand', cursive", background: "#fffdf5" }}
              placeholder="What did Mike say this time? Be specific — the more detail, the better the roast..."
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
            />
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <input
                type="date"
                className="border-2 border-[#3a1f00] focus:border-[#cc2200] focus:outline-none px-3 py-2 text-sm flex-1 min-w-[130px] rounded"
                style={{ fontFamily: "'Patrick Hand', cursive", background: "#111", color: "#fff" }}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
              <button
                onClick={submitEntry}
                disabled={submitting}
                className="bg-[#cc2200] hover:bg-[#a81a00] disabled:bg-[#999] text-white bangers tracking-widest px-5 py-2 rounded text-base transition-colors flex-shrink-0 border-2 border-[#3a1f00]"
              >
                {submitting ? "PROCESSING MIKE'S STUPIDITY..." : "ADD TO THE RECORD"}
              </button>
            </div>
            {statusMsg && (
              <p className={`text-sm mt-2 patrick ${statusType === "ok" ? "text-green-700" : statusType === "err" ? "text-red-600" : "text-[#888]"}`}>
                {statusMsg}
              </p>
            )}
          </div>
        )}

        {/* Tag Cloud */}
        {allCategories.length > 0 && (
          <div className="mt-6 border-4 border-[#3a1f00] p-4 rounded-lg" style={{ background: "#fff8e7" }}>
            <h3 className="bangers text-[#3a1f00] text-lg tracking-widest mb-3">MIKE'S HALL OF SHAME</h3>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const count = catCounts[cat] || 0;
                const ratio = count / maxCatCount;
                const fontSize = Math.round(11 + ratio * 10);
                const style = getCatStyle(cat);
                const nickname = CAT_NICKNAMES[cat] || cat;
                const isActive = catFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setCatFilter(isActive ? "" : cat); setPage(1); }}
                    className={`cloud-tag patrick rounded-full border-2 px-3 py-1 cursor-pointer ${isActive ? "active" : ""}`}
                    style={{
                      background: style.bg,
                      color: style.text,
                      borderColor: style.border,
                      fontSize: `${fontSize}px`,
                      fontWeight: ratio > 0.6 ? "bold" : "normal",
                    }}
                  >
                    {nickname} ({count})
                  </button>
                );
              })}
            </div>
            {catFilter && (
              <button
                onClick={() => { setCatFilter(""); setPage(1); }}
                className="mt-3 patrick text-xs text-[#cc2200] underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Record */}
        <div className="mt-6">
          <h2 className="bangers text-3xl border-b-4 border-[#3a1f00] pb-1 mb-4 text-[#3a1f00]">
            MIKE'S PERMANENT RECORD
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Search Mike's greatest hits..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-[140px] border-2 border-[#3a1f00] focus:border-[#cc2200] focus:outline-none px-3 py-2 text-sm rounded"
              style={{ fontFamily: "'Patrick Hand', cursive", background: "#fffdf5" }}
            />
            <select
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
              className="border-2 border-[#3a1f00] focus:border-[#cc2200] focus:outline-none px-3 py-2 text-sm rounded"
              style={{ fontFamily: "'Patrick Hand', cursive", background: "#fffdf5" }}
            >
              <option value="">All delusions</option>
              {allCategories.map((c) => <option key={c} value={c}>{CAT_NICKNAMES[c] || c}</option>)}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as "newest" | "oldest"); setPage(1); }}
              className="border-2 border-[#3a1f00] focus:border-[#cc2200] focus:outline-none px-3 py-2 text-sm rounded"
              style={{ fontFamily: "'Patrick Hand', cursive", background: "#fffdf5" }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {pageEntries.length === 0 ? (
            <div className="text-center py-12 patrick text-[#6b5e4a] italic text-lg">
              {entries.length === 0
                ? <><p>The record is clean. For now.</p><p className="mt-1 text-sm">Mike will fix that soon enough.</p></>
                : <p>Nothing matches. Mike probably said something about that too.</p>
              }
            </div>
          ) : (
            pageEntries.map((entry) => {
              const style = getCatStyle(entry.category);
              const displayNum = entries.length - entries.findIndex(e => e.id === entry.id);
              const nickname = CAT_NICKNAMES[entry.category] || entry.category;
              const character = entry.character ? CHARACTER_MAP[entry.character] : null;
              return (
                <div key={entry.id} className="entry-card bg-white border-2 border-[#3a1f00] border-l-8 p-4 mb-6 rounded-lg relative" style={{ marginTop: "20px" }}>
                  {character && (
                    <div className="sticker" title={character.name}>
                      {character.emoji}
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="bangers text-4xl text-[#ddd] leading-none mr-1">#{displayNum}</span>
                      <div>
                        <span
                          className="bangers text-xs tracking-widest px-2 py-0.5 rounded-full border-2 block"
                          style={{ background: style.bg, color: style.text, borderColor: style.border }}
                        >
                          {nickname}
                        </span>
                        <span className="patrick text-[10px] text-[#aaa] block text-center">{entry.category}</span>
                      </div>
                      <span className="patrick text-xs text-[#6b5e4a]">{formatDate(entry.date)}</span>
                    </div>
                    {unlocked && (
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs border-2 border-[#ddd] text-[#bbb] hover:border-[#cc2200] hover:text-[#cc2200] px-2 py-0.5 rounded-full transition-colors patrick"
                      >
                        ✕ Delete
                      </button>
                    )}
                  </div>
                  {entry.headline && (
                    <p className="bangers text-2xl leading-tight mb-2 text-[#cc2200] tracking-wide">{entry.headline}</p>
                  )}
                  <p className="patrick text-[15px] leading-relaxed text-[#1a1008] mb-3">{entry.text}</p>
                  {entry.verdict && (
                    <div className="border-t-2 border-dashed border-[#e0d5c0] pt-2">
                      <p className="text-sm patrick text-[#6b5e4a] leading-relaxed">
                        <span className="text-[#cc2200] font-bold">The Verdict:</span> {entry.verdict}
                      </p>
                    </div>
                  )}
                  {character && (
                    <div className="mt-2 pt-2 border-t border-[#e0d5c0]">
                      <span className="patrick text-[11px] text-[#aaa]">
                        Vibes with: {character.emoji} {character.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4 bangers text-sm tracking-widest text-[#6b5e4a]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="bg-[#3a1f00] text-[#ffd500] px-4 py-1.5 rounded disabled:bg-[#ccc] disabled:text-white border-2 border-[#3a1f00]"
              >
                ← PREV
              </button>
              <span className="patrick">Page {safePage} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="bg-[#3a1f00] text-[#ffd500] px-4 py-1.5 rounded disabled:bg-[#ccc] disabled:text-white border-2 border-[#3a1f00]"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 bangers text-xs tracking-widest text-[#ffd500] border-t-4 border-[#ffd500]" style={{ background: "#3a1f00" }}>
        TO DEMENTIA AND BEYOND &nbsp;•&nbsp; EST. 2023 &nbsp;•&nbsp; MIKE SMITHSON HAS NOT APPROVED THIS MESSAGE
      </footer>
    </div>
  );
}