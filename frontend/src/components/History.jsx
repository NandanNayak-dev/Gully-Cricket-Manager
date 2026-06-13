import React, { useMemo, useState } from "react";
import { shortDate, summarizeInning } from "../utils";

export default function History({ matches, onOpen, onDelete, onClearAll }) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const teamOptions = useMemo(() => {
    const set = new Set();
    matches.forEach((m) =>
      m.teams.forEach((t) => set.add(t.name)),
    );
    return ["all", ...Array.from(set).sort()];
  }, [matches]);

  const filtered = useMemo(() => {
    return matches
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .filter((m) => {
        const q = query.trim().toLowerCase();
        if (q) {
          const hay = (
            m.teams.map((t) => t.name).join(" ") +
            " " +
            (m.result || "")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (teamFilter !== "all") {
          if (!m.teams.some((t) => t.name === teamFilter)) return false;
        }
        if (resultFilter !== "all") {
          const winner = parseWinner(m.result);
          if (resultFilter === "tie" && winner !== "tie") return false;
          if (resultFilter !== "tie" && winner !== resultFilter) return false;
        }
        return true;
      });
  }, [matches, query, teamFilter, resultFilter]);

  const stats = useMemo(() => {
    const total = matches.length;
    const ties = matches.filter((m) => /tie/i.test(m.result || "")).length;
    return { total, ties };
  }, [matches]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Match history
            </h2>
            <p className="text-sm text-slate-500">
              {stats.total} total matches
              {stats.ties ? ` • ${stats.ties} tie(s)` : ""}
            </p>
          </div>
          {matches.length > 0 && (
            <button
              onClick={() =>
                confirm("Clear ALL match history? This cannot be undone.") &&
                onClearAll()
              }
              className="text-xs font-medium text-rose-600 hover:text-rose-700"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            placeholder="Search team or result…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pitch-400 focus:ring-1 focus:ring-pitch-200"
          />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pitch-400 focus:ring-1 focus:ring-pitch-200"
          >
            <option value="all">All teams</option>
            {teamOptions
              .filter((t) => t !== "all")
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pitch-400 focus:ring-1 focus:ring-pitch-200"
          >
            <option value="all">All results</option>
            <option value="tie">Ties only</option>
            {teamOptions
              .filter((t) => t !== "all")
              .map((t) => (
                <option key={t} value={t}>
                  {t} won
                </option>
              ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            {matches.length === 0
              ? "No matches yet. Start your first gully battle!"
              : "No matches match your filters."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              onOpen={() => onOpen(m)}
              onDelete={() => {
                if (
                  confirm(
                    `Delete match between ${m.teams[0].name} and ${m.teams[1].name}?`,
                  )
                )
                  onDelete(m.id);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MatchRow({ match, onOpen, onDelete }) {
  const f1 = summarizeInning(match.innings[0]?.balls || []);
  const f2 = match.innings[1]
    ? summarizeInning(match.innings[1].balls)
    : null;
  const t1 = match.teams[0];
  const t2 = match.teams[1];
  const t1Inn = match.innings.find(
    (i) => i.battingTeamIndex === 0,
  );
  const t2Inn = match.innings.find(
    (i) => i.battingTeamIndex === 1,
  );
  const s1 = t1Inn ? summarizeInning(t1Inn.balls) : null;
  const s2 = t2Inn ? summarizeInning(t2Inn.balls) : null;

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onOpen} className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-900">
            <span className={s1 && s2 && s1.runs > s2.runs ? "text-pitch-700" : ""}>
              {t1.name}
            </span>{" "}
            <span className="text-slate-400">vs</span>{" "}
            <span className={s1 && s2 && s2.runs > s1.runs ? "text-pitch-700" : ""}>
              {t2.name}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {shortDate(match.createdAt)} • {match.overs} ov/side •{" "}
            {match.playersPerTeam}p
          </p>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            {s1 && (
              <p>
                <span className="font-semibold text-slate-900">{s1.runs}/{s1.wickets}</span>{" "}
                <span className="text-slate-500">({t1.name}, {s1.overs})</span>
              </p>
            )}
            {s2 && (
              <p>
                <span className="font-semibold text-slate-900">{s2.runs}/{s2.wickets}</span>{" "}
                <span className="text-slate-500">({t2.name}, {s2.overs})</span>
              </p>
            )}
          </div>
          <span className="rounded-lg bg-pitch-50 px-2.5 py-1 text-[11px] font-semibold text-pitch-800">
            {match.result || "—"}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onOpen}
          className="btn-press rounded-lg bg-pitch-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pitch-800"
        >
          View scorecard →
        </button>
        <button
          onClick={onDelete}
          className="text-xs font-medium text-rose-600 hover:text-rose-700"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function parseWinner(result) {
  if (!result) return null;
  if (/tie/i.test(result)) return "tie";
  // "TeamName won by..."
  const m = result.match(/^(.+?) won/i);
  return m ? m[1].trim() : null;
}
