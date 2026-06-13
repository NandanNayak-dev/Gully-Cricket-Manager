import React, { useMemo } from "react";
import {
  batterStats,
  bowlerStats,
  summarizeInning,
  formatDate,
} from "../utils";

export default function MatchSummary({ match, onBack, onDelete }) {
  const first = match.innings[0];
  const second = match.innings[1];

  const firstBatIdx = first.battingTeamIndex;
  const secondBatIdx = second ? second.battingTeamIndex : null;

  const firstSummary = useMemo(() => summarizeInning(first.balls), [first.balls]);
  const secondSummary = second
    ? useMemo(() => summarizeInning(second.balls), [second.balls])
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-pitch-700 to-pitch-900 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-pitch-100/80">
          Final result
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {match.result || "Match completed"}
        </h2>
        <p className="mt-2 text-sm text-pitch-100/80">
          {formatDate(match.createdAt)} • {match.overs} overs per side •{" "}
          {match.playersPerTeam} players per team
        </p>
        {match.tossWinnerIndex !== null && (
          <p className="mt-1 text-xs text-pitch-100/70">
            {match.teams[match.tossWinnerIndex].name} won the toss and elected to{" "}
            {match.tossChoice}
          </p>
        )}
      </div>

      {match.innings.map((inn, i) => {
        const team = match.teams[inn.battingTeamIndex];
        const opp = match.teams[1 - inn.battingTeamIndex];
        const summary = i === 0 ? firstSummary : secondSummary;
        return (
          <Scorecard
            key={i}
            title={`Innings ${i + 1} — ${team.name}`}
            subtitle={`vs ${opp.name}`}
            team={team}
            opp={opp}
            inn={inn}
            summary={summary}
          />
        );
      })}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-press rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to history
        </button>
        <button
          onClick={onDelete}
          className="btn-press rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
        >
          Delete match
        </button>
      </div>
    </div>
  );
}

function Scorecard({ title, subtitle, team, opp, inn, summary }) {
  const battingStats = team.players.map((p) => ({
    player: p,
    ...batterStats(inn.balls, p.id),
  }));
  const bowlingStats = opp.players.map((p) => ({
    player: p,
    ...bowlerStats(inn.balls, p.id),
  }));
  const fours = inn.balls.filter((b) => Number(b.event) === 4).length;
  const sixes = inn.balls.filter((b) => Number(b.event) === 6).length;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.runs}{" "}
            <span className="text-sm font-medium text-slate-500">
              / {summary.wickets}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            {summary.overs} ov • RR {summary.runRate.toFixed(2)} •{" "}
            {summary.extras} extras
          </p>
          <p className="text-xs text-slate-500">
            {fours} fours • {sixes} sixes
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Batter</th>
              <th className="px-2 py-2 text-right">R</th>
              <th className="px-2 py-2 text-right">B</th>
              <th className="px-2 py-2 text-right">4s</th>
              <th className="px-2 py-2 text-right">6s</th>
              <th className="px-3 py-2 text-right">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {battingStats.map((s) => (
              <tr key={s.player.id}>
                <td className="px-3 py-2">
                  <span className="font-medium text-slate-900">
                    {s.player.name}
                  </span>
                  {s.out && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                      out
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-right font-semibold">
                  {s.runs}
                </td>
                <td className="px-2 py-2 text-right">{s.ballsFaced}</td>
                <td className="px-2 py-2 text-right">{s.fours}</td>
                <td className="px-2 py-2 text-right">{s.sixes}</td>
                <td className="px-3 py-2 text-right">{s.sr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Bowler</th>
              <th className="px-2 py-2 text-right">O</th>
              <th className="px-2 py-2 text-right">R</th>
              <th className="px-2 py-2 text-right">W</th>
              <th className="px-2 py-2 text-right">Wd</th>
              <th className="px-3 py-2 text-right">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bowlingStats.map((s) => (
              <tr key={s.player.id}>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {s.player.name}
                </td>
                <td className="px-2 py-2 text-right">{s.overs}</td>
                <td className="px-2 py-2 text-right">{s.runs}</td>
                <td className="px-2 py-2 text-right">{s.wickets}</td>
                <td className="px-2 py-2 text-right">{s.wides}</td>
                <td className="px-3 py-2 text-right">
                  {s.legalBalls ? s.economy.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
