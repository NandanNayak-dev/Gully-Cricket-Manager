import React, { useMemo, useState } from "react";
import {
  batterStats,
  bowlerStats,
  summarizeInning,
  formatDate,
} from "../utils";

export default function Stats({ matches }) {
  const [tab, setTab] = useState("players");

  const data = useMemo(() => {
    const playerAgg = {}; // playerId -> { player, matches, runs, balls, ... }
    const teamAgg = {}; // teamName -> { played, won, lost, tied }
    matches.forEach((m) => {
      m.teams.forEach((team, idx) => {
        if (!teamAgg[team.name])
          teamAgg[team.name] = {
            name: team.name,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            runsScored: 0,
            runsConceded: 0,
          };
        teamAgg[team.name].played += 1;
        const inn = m.innings.find((i) => i.battingTeamIndex === idx);
        if (inn) {
          const s = summarizeInning(inn.balls);
          teamAgg[team.name].runsScored += s.runs;
        }
        const oppIdx = 1 - idx;
        const oppInn = m.innings.find((i) => i.battingTeamIndex === oppIdx);
        if (oppInn) {
          const s = summarizeInning(oppInn.balls);
          teamAgg[team.name].runsConceded += s.runs;
        }
      });
      // determine winner team name
      const winner = parseWinner(m.result);
      if (winner === "tie") {
        m.teams.forEach((t) => teamAgg[t.name] && teamAgg[t.name].tied++);
      } else if (winner) {
        if (teamAgg[winner]) teamAgg[winner].won++;
        m.teams.forEach((t) => {
          if (t.name !== winner && teamAgg[t.name]) teamAgg[t.name].lost++;
        });
      }
      // per player aggregation across all innings
      m.innings.forEach((inn) => {
        const battingTeam = m.teams[inn.battingTeamIndex];
        const bowlingTeam = m.teams[1 - inn.battingTeamIndex];
        battingTeam.players.forEach((p) => {
          const s = batterStats(inn.balls, p.id);
          if (!playerAgg[p.id])
            playerAgg[p.id] = {
              id: p.id,
              name: p.name,
              team: battingTeam.name,
              matches: new Set(),
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              outs: 0,
              highScore: 0,
            };
          playerAgg[p.id].matches.add(m.id);
          playerAgg[p.id].runs += s.runs;
          playerAgg[p.id].balls += s.ballsFaced;
          playerAgg[p.id].fours += s.fours;
          playerAgg[p.id].sixes += s.sixes;
          playerAgg[p.id].outs += s.out ? 1 : 0;
          playerAgg[p.id].highScore = Math.max(
            playerAgg[p.id].highScore,
            s.runs,
          );
          if (s.ballsFaced > 0) playerAgg[p.id].innings += 1;
        });
        bowlingTeam.players.forEach((p) => {
          const s = bowlerStats(inn.balls, p.id);
          if (!playerAgg[p.id])
            playerAgg[p.id] = {
              id: p.id,
              name: p.name,
              team: bowlingTeam.name,
              matches: new Set(),
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              outs: 0,
              highScore: 0,
            };
          playerAgg[p.id].matches.add(m.id);
          // Bowling stats tracked separately below
        });
      });
    });

    // Bowling aggregates
    const bowlerAgg = {};
    matches.forEach((m) => {
      m.innings.forEach((inn) => {
        const bowlingTeam = m.teams[1 - inn.battingTeamIndex];
        bowlingTeam.players.forEach((p) => {
          const s = bowlerStats(inn.balls, p.id);
          if (!s.legalBalls && !s.wickets && !s.runs) return;
          if (!bowlerAgg[p.id])
            bowlerAgg[p.id] = {
              id: p.id,
              name: p.name,
              team: bowlingTeam.name,
              matches: new Set(),
              legalBalls: 0,
              runs: 0,
              wickets: 0,
              wides: 0,
            };
          bowlerAgg[p.id].matches.add(m.id);
          bowlerAgg[p.id].legalBalls += s.legalBalls;
          bowlerAgg[p.id].runs += s.runs;
          bowlerAgg[p.id].wickets += s.wickets;
          bowlerAgg[p.id].wides += s.wides;
        });
      });
    });

    return {
      players: Object.values(playerAgg),
      bowlers: Object.values(bowlerAgg),
      teams: Object.values(teamAgg),
    };
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">
          No matches recorded yet. Stats will appear after your first match.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Records &amp; stats
            </h2>
            <p className="text-sm text-slate-500">
              {matches.length} match{matches.length === 1 ? "" : "es"} analyzed
            </p>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <TabBtn active={tab === "players"} onClick={() => setTab("players")}>
              Players
            </TabBtn>
            <TabBtn active={tab === "bowlers"} onClick={() => setTab("bowlers")}>
              Bowlers
            </TabBtn>
            <TabBtn active={tab === "teams"} onClick={() => setTab("teams")}>
              Teams
            </TabBtn>
          </div>
        </div>
      </div>

      {tab === "players" && <PlayerStatsTable players={data.players} />}
      {tab === "bowlers" && <BowlerStatsTable bowlers={data.bowlers} />}
      {tab === "teams" && <TeamStatsTable teams={data.teams} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
        active
          ? "bg-white text-pitch-800 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function PlayerStatsTable({ players }) {
  const topRunScorer = useMemo(
    () =>
      [...players].sort((a, b) => b.runs - a.runs)[0],
    [players],
  );
  const topStrikeRate = useMemo(
    () =>
      [...players]
        .filter((p) => p.balls >= 10)
        .sort((a, b) => b.runs / Math.max(1, b.balls) - a.runs / Math.max(1, a.balls))[0],
    [players],
  );
  const bestAvg = useMemo(
    () =>
      [...players]
        .filter((p) => p.outs > 0 && p.innings > 0)
        .sort(
          (a, b) =>
            b.runs / Math.max(1, b.outs) - a.runs / Math.max(1, a.outs),
        )[0],
    [players],
  );
  const highScore = useMemo(
    () => [...players].sort((a, b) => b.highScore - a.highScore)[0],
    [players],
  );

  const sorted = [...players].sort((a, b) => b.runs - a.runs);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Highlight label="Top run-scorer" value={topRunScorer?.name} sub={`${topRunScorer?.runs || 0} runs`} />
        <Highlight label="Highest score" value={highScore?.name} sub={`${highScore?.highScore || 0}*`} />
        <Highlight
          label="Best average"
          value={bestAvg?.name}
          sub={bestAvg ? `${(bestAvg.runs / bestAvg.outs).toFixed(1)}` : "—"}
        />
        <Highlight
          label="Top strike rate"
          value={topStrikeRate?.name}
          sub={
            topStrikeRate
              ? `${((topStrikeRate.runs / topStrikeRate.balls) * 100).toFixed(1)}`
              : "—"
          }
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Player</th>
              <th className="px-2 py-2">Team</th>
              <th className="px-2 py-2 text-right">Mat</th>
              <th className="px-2 py-2 text-right">Inns</th>
              <th className="px-2 py-2 text-right">Runs</th>
              <th className="px-2 py-2 text-right">HS</th>
              <th className="px-2 py-2 text-right">Avg</th>
              <th className="px-2 py-2 text-right">SR</th>
              <th className="px-2 py-2 text-right">4s</th>
              <th className="px-3 py-2 text-right">6s</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((p) => {
              const avg = p.outs ? (p.runs / p.outs).toFixed(1) : "—";
              const sr = p.balls
                ? ((p.runs / p.balls) * 100).toFixed(1)
                : "—";
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="px-2 py-2 text-slate-500">{p.team}</td>
                  <td className="px-2 py-2 text-right">{p.matches.size}</td>
                  <td className="px-2 py-2 text-right">{p.innings}</td>
                  <td className="px-2 py-2 text-right font-semibold">
                    {p.runs}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {p.highScore}
                    {p.highScore && p.highScore >= 50 ? "*" : ""}
                  </td>
                  <td className="px-2 py-2 text-right">{avg}</td>
                  <td className="px-2 py-2 text-right">{sr}</td>
                  <td className="px-2 py-2 text-right">{p.fours}</td>
                  <td className="px-3 py-2 text-right">{p.sixes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BowlerStatsTable({ bowlers }) {
  const topWicket = useMemo(
    () =>
      [...bowlers].sort((a, b) => b.wickets - a.wickets)[0],
    [bowlers],
  );
  const bestEcon = useMemo(
    () =>
      [...bowlers]
        .filter((b) => b.legalBalls >= 12)
        .sort(
          (a, b) =>
            a.runs / Math.max(1, a.legalBalls) -
            b.runs / Math.max(1, b.legalBalls),
        )[0],
    [bowlers],
  );
  const bestAvg = useMemo(
    () =>
      [...bowlers]
        .filter((b) => b.wickets > 0)
        .sort(
          (a, b) =>
            a.runs / Math.max(1, a.wickets) -
            b.runs / Math.max(1, b.wickets),
        )[0],
    [bowlers],
  );

  const fmt = (b) => `${Math.floor(b / 6)}.${b % 6}`;

  const sorted = [...bowlers].sort(
    (a, b) => b.wickets - a.wickets || a.runs - b.runs,
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Highlight label="Top wicket-taker" value={topWicket?.name} sub={`${topWicket?.wickets || 0} wkts`} />
        <Highlight
          label="Best average"
          value={bestAvg?.name}
          sub={
            bestAvg ? `${(bestAvg.runs / bestAvg.wickets).toFixed(1)}` : "—"
          }
        />
        <Highlight
          label="Best economy"
          value={bestEcon?.name}
          sub={
            bestEcon ? `${(bestEcon.runs / bestEcon.legalBalls * 6).toFixed(2)}` : "—"
          }
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Bowler</th>
              <th className="px-2 py-2">Team</th>
              <th className="px-2 py-2 text-right">Mat</th>
              <th className="px-2 py-2 text-right">Overs</th>
              <th className="px-2 py-2 text-right">Runs</th>
              <th className="px-2 py-2 text-right">Wkts</th>
              <th className="px-2 py-2 text-right">Avg</th>
              <th className="px-2 py-2 text-right">Econ</th>
              <th className="px-3 py-2 text-right">Wides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((b) => {
              const avg = b.wickets ? (b.runs / b.wickets).toFixed(1) : "—";
              const econ = b.legalBalls
                ? ((b.runs / b.legalBalls) * 6).toFixed(2)
                : "—";
              return (
                <tr key={b.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {b.name}
                  </td>
                  <td className="px-2 py-2 text-slate-500">{b.team}</td>
                  <td className="px-2 py-2 text-right">{b.matches.size}</td>
                  <td className="px-2 py-2 text-right">{fmt(b.legalBalls)}</td>
                  <td className="px-2 py-2 text-right font-semibold">
                    {b.runs}
                  </td>
                  <td className="px-2 py-2 text-right">{b.wickets}</td>
                  <td className="px-2 py-2 text-right">{avg}</td>
                  <td className="px-2 py-2 text-right">{econ}</td>
                  <td className="px-3 py-2 text-right">{b.wides}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamStatsTable({ teams }) {
  const sorted = [...teams].sort((a, b) => b.won - a.won);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Team</th>
            <th className="px-2 py-2 text-right">Played</th>
            <th className="px-2 py-2 text-right">Won</th>
            <th className="px-2 py-2 text-right">Lost</th>
            <th className="px-2 py-2 text-right">Tied</th>
            <th className="px-2 py-2 text-right">Win %</th>
            <th className="px-2 py-2 text-right">Runs for</th>
            <th className="px-3 py-2 text-right">Runs against</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((t) => {
            const winPct = t.played
              ? ((t.won / t.played) * 100).toFixed(0)
              : "0";
            return (
              <tr key={t.name}>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {t.name}
                </td>
                <td className="px-2 py-2 text-right">{t.played}</td>
                <td className="px-2 py-2 text-right font-semibold text-pitch-700">
                  {t.won}
                </td>
                <td className="px-2 py-2 text-right text-rose-700">{t.lost}</td>
                <td className="px-2 py-2 text-right">{t.tied}</td>
                <td className="px-2 py-2 text-right">{winPct}%</td>
                <td className="px-2 py-2 text-right">{t.runsScored}</td>
                <td className="px-3 py-2 text-right">{t.runsConceded}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Highlight({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-pitch-50 to-white p-4 ring-1 ring-pitch-100">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-pitch-700/80">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-slate-900">
        {value || "—"}
      </p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function parseWinner(result) {
  if (!result) return null;
  if (/tie/i.test(result)) return "tie";
  const m = result.match(/^(.+?) won/i);
  return m ? m[1].trim() : null;
}
