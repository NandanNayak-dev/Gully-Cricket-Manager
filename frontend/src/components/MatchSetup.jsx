import React, { useMemo, useState } from "react";
import { uid } from "../utils";

const DEFAULT_PLAYER_NAMES = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8",
  "Player 9",
  "Player 10",
  "Player 11",
];

export default function MatchSetup({ onStart, onCancel }) {
  const [teamAName, setTeamAName] = useState("Team A");
  const [teamBName, setTeamBName] = useState("Team B");
  const [overs, setOvers] = useState(5);
  const [playersPerTeam, setPlayersPerTeam] = useState(8);

  const [includeToss, setIncludeToss] = useState(true);
  const [tossWinnerIndex, setTossWinnerIndex] = useState(0);
  const [tossChoice, setTossChoice] = useState("bat");

  const requiredPlayers = Math.min(11, Math.max(2, playersPerTeam));

  const makePlayers = (count, prefix) =>
    Array.from({ length: count }, (_, i) => ({
      id: uid(),
      name: `${prefix} ${i + 1}`,
    }));

  const [teamAPlayers, setTeamAPlayers] = useState(() =>
    makePlayers(requiredPlayers, "A"),
  );
  const [teamBPlayers, setTeamBPlayers] = useState(() =>
    makePlayers(requiredPlayers, "B"),
  );

  // When player count changes, rebuild
  React.useEffect(() => {
    setTeamAPlayers((prev) => {
      const next = [...prev];
      while (next.length < requiredPlayers) {
        next.push({ id: uid(), name: `A ${next.length + 1}` });
      }
      return next.slice(0, requiredPlayers);
    });
  }, [requiredPlayers]);

  React.useEffect(() => {
    setTeamBPlayers((prev) => {
      const next = [...prev];
      while (next.length < requiredPlayers) {
        next.push({ id: uid(), name: `B ${next.length + 1}` });
      }
      return next.slice(0, requiredPlayers);
    });
  }, [requiredPlayers]);

  // First batting index: derived from toss if present
  const firstBattingIndex = useMemo(() => {
    if (!includeToss) return 0;
    return tossChoice === "bat" ? tossWinnerIndex : 1 - tossWinnerIndex;
  }, [includeToss, tossWinnerIndex, tossChoice]);

  const valid =
    teamAName.trim() &&
    teamBName.trim() &&
    overs >= 1 &&
    overs <= 50 &&
    teamAPlayers.length === requiredPlayers &&
    teamBPlayers.length === requiredPlayers &&
    teamAPlayers.every((p) => p.name.trim()) &&
    teamBPlayers.every((p) => p.name.trim());

  const handleStart = () => {
    if (!valid) return;
    onStart({
      teamA: { id: uid(), name: teamAName.trim(), players: teamAPlayers },
      teamB: { id: uid(), name: teamBName.trim(), players: teamBPlayers },
      overs,
      playersPerTeam: requiredPlayers,
      firstBattingIndex,
      tossWinnerIndex: includeToss ? tossWinnerIndex : null,
      tossChoice: includeToss ? tossChoice : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          New match
        </h2>
        <p className="text-sm text-slate-500">
          Set up teams, overs, and players.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TeamNameField
            label="Team A"
            value={teamAName}
            onChange={setTeamAName}
            color="amber"
          />
          <TeamNameField
            label="Team B"
            value={teamBName}
            onChange={setTeamBName}
            color="sky"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Overs per side"
            value={overs}
            min={1}
            max={50}
            onChange={(v) => setOvers(v)}
          />
          <NumberField
            label="Players per team"
            value={requiredPlayers}
            min={2}
            max={11}
            onChange={(v) => setPlayersPerTeam(v)}
          />
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-pitch-100 bg-pitch-50/60 p-4">
          <input
            id="includeToss"
            type="checkbox"
            checked={includeToss}
            onChange={(e) => setIncludeToss(e.target.checked)}
            className="h-4 w-4 rounded border-pitch-300 text-pitch-600 focus:ring-pitch-500"
          />
          <label
            htmlFor="includeToss"
            className="text-sm font-medium text-pitch-800"
          >
            Record toss details
          </label>
        </div>

        {includeToss && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Toss winner
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <TossButton
                  selected={tossWinnerIndex === 0}
                  onClick={() => setTossWinnerIndex(0)}
                  label={teamAName || "Team A"}
                />
                <TossButton
                  selected={tossWinnerIndex === 1}
                  onClick={() => setTossWinnerIndex(1)}
                  label={teamBName || "Team B"}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Elected to
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <TossButton
                  selected={tossChoice === "bat"}
                  onClick={() => setTossChoice("bat")}
                  label="Bat"
                />
                <TossButton
                  selected={tossChoice === "bowl"}
                  onClick={() => setTossChoice("bowl")}
                  label="Bowl"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {tossWinnerIndex === 0 ? teamAName : teamBName} won the toss and
                elected to {tossChoice}.{" "}
                <span className="font-semibold text-pitch-700">
                  {firstBattingIndex === 0 ? teamAName : teamBName}
                </span>{" "}
                will bat first.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PlayerGrid
          title={teamAName || "Team A"}
          players={teamAPlayers}
          onChange={setTeamAPlayers}
          color="amber"
        />
        <PlayerGrid
          title={teamBName || "Team B"}
          players={teamBPlayers}
          onChange={setTeamBPlayers}
          color="sky"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pitch-100 bg-white p-4">
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleStart}
          disabled={!valid}
          className="btn-press rounded-xl bg-pitch-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pitch-700/20 enabled:hover:bg-pitch-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Start match →
        </button>
      </div>
    </div>
  );
}

function TeamNameField({ label, value, onChange, color }) {
  const tone =
    color === "amber"
      ? "bg-amber-100 text-amber-600"
      : "bg-sky-100 text-sky-600";
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-pitch-400 focus-within:ring-2 focus-within:ring-pitch-200">
        <span className={`grid h-7 w-7 place-items-center rounded-md ${tone}`}>
          <ShirtIcon className="h-4 w-4" />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} name`}
          className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          −
        </button>
        <input
          value={value}
          type="number"
          onChange={(e) =>
            onChange(
              Math.min(max, Math.max(min, Number(e.target.value) || min)),
            )
          }
          className="flex-1 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-8 w-8 place-items-center rounded-md bg-pitch-600 text-white hover:bg-pitch-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

function TossButton({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-press rounded-lg border px-3 py-2 text-sm font-medium ${
        selected
          ? "border-pitch-500 bg-pitch-50 text-pitch-800"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function PlayerGrid({ title, players, onChange, color }) {
  const tone =
    color === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-sky-100 text-sky-700";
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          {title} — Players
        </h3>
        <span className="text-xs text-slate-500">{players.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-md text-xs font-semibold ${tone}`}>
              {i + 1}
            </span>
            <input
              value={p.name}
              onChange={(e) => {
                const next = [...players];
                next[i] = { ...p, name: e.target.value };
                onChange(next);
              }}
              placeholder={`Player ${i + 1}`}
              className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-pitch-400 focus:ring-1 focus:ring-pitch-200"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShirtIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 4l-2 3 2 1h10l2-1-2-3M5 9l1 11h12l1-11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// keep util for default names (avoids unused warning in some bundlers)
export const _defaults = DEFAULT_PLAYER_NAMES;
