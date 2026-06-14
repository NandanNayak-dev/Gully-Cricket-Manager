import React, { useEffect, useMemo, useState } from "react";
import {
  WICKET_TYPES,
  batterStats,
  bowlerStats,
  currentOverBalls,
  summarizeInning,
  partnership,
  lastBall,
  requiredRunRate,
} from "../utils";

export default function LiveMatch({
  match,
  onBall,
  onUndo,
  onRotateStrike,
  onSetBowler,
  onSetStriker,
  onBreakComplete,
  onEndInning,
  onCancel,
}) {
  const inning = match.innings[match.currentInningIndex];
  const battingTeamIdx = inning.battingTeamIndex;
  const battingTeam = match.teams[battingTeamIdx];
  const bowlingTeam = match.teams[1 - battingTeamIdx];

  const strikerId = inning.strikerId;
  const nonStrikerId = inning.nonStrikerId;
  const bowlerId = inning.bowlerId;

  const striker = battingTeam.players.find((p) => p.id === strikerId);
  const nonStriker = battingTeam.players.find((p) => p.id === nonStrikerId);
  const bowler = bowlingTeam.players.find((p) => p.id === bowlerId);

  const summary = useMemo(() => summarizeInning(inning.balls), [inning.balls]);
  const overBalls = useMemo(() => currentOverBalls(inning.balls), [inning.balls]);
  const part = useMemo(
    () => partnership(inning.balls, inning, battingTeam),
    [inning.balls, inning, battingTeam],
  );
  const last = useMemo(() => lastBall(inning.balls), [inning.balls]);

  const inningNumber = match.currentInningIndex + 1;
  const isSecond = inningNumber === 2;
  const firstInnSummary = isSecond ? summarizeInning(match.innings[0].balls) : null;
  const target = isSecond ? firstInnSummary.runs + 1 : null;
  const maxBalls = match.overs * 6;
  const ballsRemaining = maxBalls - summary.balls;
  const rr = summary.runRate;
  const rrr = isSecond
    ? requiredRunRate(target, summary.runs, ballsRemaining)
    : null;
  const need = isSecond ? target - summary.runs : null;
  const [nowMs, setNowMs] = useState(Date.now());
  const breakRemainingMs = Math.max(0, (match.breakUntil || 0) - nowMs);
  const breakRemainingSec = Math.ceil(breakRemainingMs / 1000);
  const isInningsBreak = breakRemainingMs > 0;

  useEffect(() => {
    if (!isInningsBreak) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isInningsBreak]);

  useEffect(() => {
    if (!match.breakUntil || match.breakType !== "innings") return;
    if (breakRemainingMs > 0) return;
    onBreakComplete();
  }, [match.breakUntil, match.breakType, breakRemainingMs, onBreakComplete]);

  const [showWicket, setShowWicket] = useState(false);
  const [wicketType, setWicketType] = useState("Bowled");
  const [newStrikerId, setNewStrikerId] = useState(strikerId);
  const [showExtras, setShowExtras] = useState(null); // "wd" | "nb" | "b" | "lb"
  const [extraRuns, setExtraRuns] = useState(0);
  const [overEndOpen, setOverEndOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);

  const strikerStat = useMemo(
    () => batterStats(inning.balls, strikerId),
    [inning.balls, strikerId],
  );
  const nonStrikerStat = useMemo(
    () => batterStats(inning.balls, nonStrikerId),
    [inning.balls, nonStrikerId],
  );
  const bowlerStat = useMemo(
    () => bowlerStats(inning.balls, bowlerId),
    [inning.balls, bowlerId],
  );

  const dismissedBatterIds = useMemo(() => {
    const out = new Set();
    for (const b of inning.balls) {
      if (b.event === "W" && b.strikerId) out.add(b.strikerId);
    }
    return out;
  }, [inning.balls]);

  const availableNewBatters = useMemo(
    () =>
      battingTeam.players.filter(
        (p) =>
          p.id !== strikerId &&
          p.id !== nonStrikerId &&
          !dismissedBatterIds.has(p.id),
      ),
    [battingTeam.players, strikerId, nonStrikerId, dismissedBatterIds],
  );

  const inningOverByBalls = summary.balls >= maxBalls;
  const inningOverByWickets = summary.wickets >= battingTeam.players.length - 1;
  const inningOver = inningOverByBalls || inningOverByWickets;
  const targetReached =
    isSecond && summary.runs > (firstInnSummary.runs || 0);

  // Helper to dispatch a ball event via store, capturing lineup at the time
  const submit = (eventObj) => {
    if (isInningsBreak) return;
    onBall({
      ...eventObj,
      strikerId,
      nonStrikerId,
      bowlerId,
      at: Date.now(),
    });
  };

  // End of over handler — must rotate strike if innings not over
  const handleEndOver = () => {
    if (isInningsBreak) return;
    setOverEndOpen(false);
    onRotateStrike();
  };

  const handleEndOverNoSwap = () => {
    if (isInningsBreak) return;
    setOverEndOpen(false);
  };

  const [showBowlerSelect, setShowBowlerSelect] = useState(false);

  const handleWicket = () => {
    if (isInningsBreak) return;
    submit({ event: "W", wicketType });
    if (newStrikerId && availableNewBatters.some((p) => p.id === newStrikerId)) {
      onSetStriker(newStrikerId);
    }
    setShowWicket(false);
    setWicketType("Bowled");
    setNewStrikerId(null);
  };

  const handleExtra = () => {
    if (isInningsBreak) return;
    if (!showExtras) return;
    if (showExtras === "wd") submit({ event: "wd", runs: 1 + extraRuns });
    else if (showExtras === "nb")
      submit({ event: "nb", runs: extraRuns });
    else if (showExtras === "b")
      submit({ event: "b", runs: extraRuns });
    else if (showExtras === "lb")
      submit({ event: "lb", runs: extraRuns });
    setShowExtras(null);
    setExtraRuns(0);
  };

  const handleRun = (r) => {
    if (isInningsBreak) return;
    submit({ event: String(r), runs: r });
  };

  const handleDot = () => {
    if (isInningsBreak) return;
    submit({ event: "0", runs: 0 });
  };

  const handleUndo = () => {
    if (isInningsBreak) return;
    setUndoOpen(false);
    onUndo();
  };

  // Inning complete check after each render is handled by parent via store.
  // We surface a banner if end inning button is needed.

  if (match.status === "completed") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Match Completed!</h2>
          <p className="mt-2 text-lg font-medium text-slate-700">{match.result}</p>
        </div>
        <button
          onClick={() => {
            onEndInning(); // this will trigger the archive in App.jsx
          }}
          className="btn-press rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Save Match & View Summary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top match strip */}
      <div className="rounded-2xl border border-pitch-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-pitch-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-pitch-800">
              Inning {inningNumber} of 2
            </span>
            <span className="text-sm font-medium text-slate-700">
              {battingTeam.name}{" "}
              <span className="text-slate-400">vs</span>{" "}
              <span className="text-slate-700">{bowlingTeam.name}</span>
            </span>
            {isSecond && target && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                Target {target}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUndoOpen(true)}
              className="btn-press rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              disabled={inning.balls.length === 0 || isInningsBreak}
            >
              Undo last ball
            </button>
            <button
              onClick={onCancel}
              className="btn-press rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              Cancel match
            </button>
          </div>
        </div>
      </div>

      {isInningsBreak && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-semibold">Innings break in progress</p>
          <p className="text-xs">Second innings starts in {breakRemainingSec}s.</p>
        </div>
      )}

      {/* Scoreboard */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="scoreboard-shadow rounded-2xl bg-gradient-to-br from-pitch-700 to-pitch-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-pitch-100/90">
              {battingTeam.name}
            </p>
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Batting
            </span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-bold leading-none tracking-tight">
              {summary.runs}
            </p>
            <p className="pb-1 text-xl font-medium text-pitch-100/80">
              / {summary.wickets}
            </p>
          </div>
          <p className="mt-1 text-sm text-pitch-100/80">
            ({summary.overs} ov)
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="RR" value={rr.toFixed(2)} />
            <Stat
              label={isSecond ? "Need" : "Extras"}
              value={
                isSecond
                  ? `${need} (${ballsRemaining})`
                  : summary.extras
              }
            />
            <Stat
              label={isSecond ? "RRR" : "4s/6s"}
              value={
                isSecond
                  ? rrr.toFixed(2)
                  : `${summary.fours}/${summary.sixes}`
              }
            />
          </div>
        </div>

        <BatterCard
          label="On strike"
          player={striker}
          stats={strikerStat}
          highlight
        />
        <BatterCard
          label="Non-striker"
          player={nonStriker}
          stats={nonStrikerStat}
        />
      </div>

      {/* Bowler + partnership + current over */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BowlerCard player={bowler} stats={bowlerStat} />
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Partnership
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {part.runs}{" "}
            <span className="text-sm font-medium text-slate-500">
              ({part.overs})
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {part.striker?.name || "?"} & {part.nonStriker?.name || "?"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            This over — {bowler?.name || "Bowler"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 min-h-[28px]">
            {overBalls.length === 0 && (
              <span className="text-xs text-slate-400">No balls yet</span>
            )}
            {overBalls.map((b, i) => (
              <BallChip key={i} ball={b} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Last:{" "}
            <LastBallChip ball={last} />
          </p>
        </div>
      </div>

      {/* Score input pad */}
      <div
        className={`rounded-2xl border border-pitch-100 bg-white p-4 shadow-sm ${
          isInningsBreak ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Score input
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          <RunButton label="0" sub="Dot" onClick={handleDot} tone="slate" />
          <RunButton label="1" onClick={() => handleRun(1)} tone="sky" />
          <RunButton
            label="2"
            onClick={() => handleRun(2)}
            tone="emerald"
          />
          <RunButton label="3" onClick={() => handleRun(3)} tone="lime" />
          <RunButton
            label="4"
            sub="Four"
            onClick={() => handleRun(4)}
            tone="amber"
            big
          />
          <RunButton
            label="6"
            sub="Six"
            onClick={() => handleRun(6)}
            tone="rose"
            big
          />
          <RunButton
            label="W"
            sub="Wicket"
            onClick={() => {
              setNewStrikerId(availableNewBatters[0]?.id || null);
              setShowWicket(true);
            }}
            tone="red"
            big
          />
          <ControlButton
            label="Wide"
            sub="wd"
            onClick={() => {
              setShowExtras("wd");
              setExtraRuns(0);
            }}
            tone="purple"
          />
          <ControlButton
            label="No-ball"
            sub="nb"
            onClick={() => {
              setShowExtras("nb");
              setExtraRuns(0);
            }}
            tone="indigo"
          />
          <ControlButton
            label="Bye"
            sub="b"
            onClick={() => {
              setShowExtras("b");
              setExtraRuns(0);
            }}
            tone="cyan"
          />
          <ControlButton
            label="Leg bye"
            sub="lb"
            onClick={() => {
              setShowExtras("lb");
              setExtraRuns(0);
            }}
            tone="teal"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ActionButton
            label="Rotate strike"
            onClick={onRotateStrike}
          />
          <ActionButton
            label={`New bowler (${bowler?.name || "?"})`}
            onClick={() => setShowBowlerSelect(true)}
          />
          <ActionButton
            label="End over ↻"
            onClick={() => setOverEndOpen(true)}
            tone="amber"
          />
        </div>

        {(inningOver || targetReached) && !isInningsBreak && (
          <div className="mt-4 rounded-xl bg-pitch-50 p-4">
            <p className="text-sm font-semibold text-pitch-800">
              {inningOverByWickets
                ? "All out!"
                : inningOverByBalls
                  ? "Overs complete."
                  : "Target reached!"}
            </p>
            <p className="text-xs text-pitch-700/80">
              End this innings to continue.
            </p>
            <button
              onClick={onEndInning}
              className="btn-press mt-3 rounded-xl bg-pitch-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pitch-700/20 hover:bg-pitch-800"
            >
              End innings →
            </button>
          </div>
        )}
      </div>

      {/* Wicket modal */}
      {showWicket && (
        <Modal title="Wicket" onClose={() => setShowWicket(false)}>
          <p className="text-sm text-slate-500">
            How was{" "}
            <span className="font-semibold text-slate-900">
              {striker?.name || "Striker"}
            </span>{" "}
            dismissed?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {WICKET_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setWicketType(t)}
                className={`btn-press rounded-lg border px-3 py-2 text-sm font-medium ${
                  wicketType === t
                    ? "border-pitch-500 bg-pitch-50 text-pitch-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            New batter (replacing striker)
          </p>
          <p className="text-xs text-slate-500">
            {nonStriker?.name || "—"} will remain at non-strike.
          </p>
          <div className="mt-2 grid max-h-44 grid-cols-2 gap-2 overflow-auto">
            {battingTeam.players.map((p) => {
              const isNonStriker = p.id === nonStrikerId;
              const isCurrentStriker = p.id === strikerId;
              const isAlreadyOut = dismissedBatterIds.has(p.id);
              const selected = newStrikerId === p.id;
              return (
                <button
                  key={p.id}
                  disabled={isNonStriker || isCurrentStriker || isAlreadyOut}
                  onClick={() => setNewStrikerId(p.id)}
                  className={`btn-press rounded-lg border px-3 py-2 text-left text-xs ${
                    isNonStriker || isCurrentStriker || isAlreadyOut
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                      : selected
                        ? "border-pitch-500 bg-pitch-50 text-pitch-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p.name}
                  {isNonStriker && (
                    <span className="ml-1 text-[10px] uppercase">
                      non-strike
                    </span>
                  )}
                  {isCurrentStriker && (
                    <span className="ml-1 text-[10px] uppercase">
                      out
                    </span>
                  )}
                  {isAlreadyOut && (
                    <span className="ml-1 text-[10px] uppercase">
                      out
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setShowWicket(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleWicket}
              disabled={availableNewBatters.length > 0 && !newStrikerId}
              className="btn-press rounded-lg bg-pitch-700 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-pitch-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Record wicket
            </button>
          </div>
        </Modal>
      )}

      {/* Extras modal */}
      {showExtras && (
        <Modal
          title={`Record ${
            showExtras === "wd"
              ? "wide"
              : showExtras === "nb"
                ? "no-ball"
                : showExtras === "b"
                  ? "bye"
                  : "leg bye"
          }`}
          onClose={() => setShowExtras(null)}
        >
          <p className="text-sm text-slate-600">
            How many runs came from this delivery?
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
              <button
                key={r}
                onClick={() => setExtraRuns(r)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                  extraRuns === r
                    ? "border-pitch-500 bg-pitch-50 text-pitch-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowExtras(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExtra}
              className="btn-press rounded-lg bg-pitch-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pitch-800"
            >
              Add
            </button>
          </div>
        </Modal>
      )}

      {/* End over modal */}
      {overEndOpen && (
        <Modal title="End of over" onClose={() => setOverEndOpen(false)}>
          <p className="text-sm text-slate-600">
            Rotate strike and bring a new bowler?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionButton
              label="Rotate strike + new bowler"
              onClick={handleEndOver}
              tone="pitch"
              fullWidth
            />
            <ActionButton
              label="Same strike, new bowler"
              onClick={handleEndOverNoSwap}
              tone="amber"
              fullWidth
            />
          </div>
        </Modal>
      )}

      {/* Bowler select modal */}
      {showBowlerSelect && (
        <Modal
          title={`Select new bowler — ${bowlingTeam.name}`}
          onClose={() => setShowBowlerSelect(false)}
        >
          <p className="text-sm text-slate-500">
            Pick a player from {bowlingTeam.name}.
          </p>
          <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-auto">
            {bowlingTeam.players.map((p) => (
              <button
                key={p.id}
                disabled={p.id === bowlerId}
                onClick={() => {
                  onSetBowler(p.id);
                  setShowBowlerSelect(false);
                }}
                className={`btn-press rounded-lg border px-3 py-2 text-left text-sm ${
                  p.id === bowlerId
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-pitch-50"
                }`}
              >
                {p.name}
                {p.id === bowlerId && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                    bowling
                  </span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Undo modal */}
      {undoOpen && (
        <Modal title="Undo last ball?" onClose={() => setUndoOpen(false)}>
          <p className="text-sm text-slate-600">
            This will remove the most recent ball and restore the previous
            lineup state.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setUndoOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUndo}
              className="btn-press rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Undo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-pitch-100/70">
        {label}
      </p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function BatterCard({ label, player, stats, highlight }) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        highlight
          ? "bg-gradient-to-br from-amber-200 via-amber-50 to-amber-100 ring-1 ring-amber-300/60"
          : "bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">
        {player?.name || "—"}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <MiniStat label="Runs" value={stats.runs} />
        <MiniStat label="Balls" value={stats.ballsFaced} />
        <MiniStat label="4s/6s" value={`${stats.fours}/${stats.sixes}`} />
        <MiniStat label="SR" value={stats.sr} />
      </div>
    </div>
  );
}

function BowlerCard({ player, stats }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Bowler
      </p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">
        {player?.name || "—"}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <MiniStat label="Overs" value={stats.overs} />
        <MiniStat label="Runs" value={stats.runs} />
        <MiniStat label="Wkts" value={stats.wickets} />
        <MiniStat label="Econ" value={stats.economy.toFixed(2)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function BallChip({ ball }) {
  const e = ball.event;
  const map = {
    "0": { label: "•", cls: "bg-slate-100 text-slate-700" },
    "1": { label: "1", cls: "bg-sky-100 text-sky-700" },
    "2": { label: "2", cls: "bg-emerald-100 text-emerald-700" },
    "3": { label: "3", cls: "bg-lime-100 text-lime-700" },
    "4": { label: "4", cls: "bg-amber-200 text-amber-800" },
    "6": { label: "6", cls: "bg-rose-200 text-rose-800" },
    b: { label: "b", cls: "bg-cyan-100 text-cyan-700" },
    lb: { label: "lb", cls: "bg-teal-100 text-teal-700" },
    wd: { label: "wd", cls: "bg-violet-100 text-violet-700" },
    nb: { label: "nb", cls: "bg-indigo-100 text-indigo-700" },
    W: { label: "W", cls: "bg-red-200 text-red-800" },
  };
  const data = map[e] || { label: e, cls: "bg-slate-100 text-slate-700" };
  return (
    <span
      className={`grid h-7 min-w-[28px] place-items-center rounded-md px-1 text-xs font-bold ${data.cls}`}
      title={`${e}${ball.runs ? ` (${ball.runs})` : ""}`}
    >
      {data.label}
    </span>
  );
}

function LastBallChip({ ball }) {
  if (!ball) return <span className="text-slate-400">—</span>;
  const e = ball.event;
  if (e === "W") return <span className="font-semibold text-red-600">Wicket</span>;
  if (e === "wd") return <span className="font-semibold text-violet-600">Wide</span>;
  if (e === "nb") return <span className="font-semibold text-indigo-600">No-ball</span>;
  if (e === "b") return <span className="font-semibold text-cyan-600">Bye {ball.runs || 0}</span>;
  if (e === "lb")
    return <span className="font-semibold text-teal-600">Leg bye {ball.runs || 0}</span>;
  return (
    <span className="font-semibold text-slate-900">
      {Number(e) || 0} run{Number(e) === 1 ? "" : "s"}
    </span>
  );
}

function RunButton({ label, sub, onClick, tone, big }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    sky: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    lime: "bg-lime-100 text-lime-700 hover:bg-lime-200",
    amber: "bg-amber-200 text-amber-900 hover:bg-amber-300",
    rose: "bg-rose-200 text-rose-900 hover:bg-rose-300",
    red: "bg-red-200 text-red-900 hover:bg-red-300",
    purple: "bg-violet-100 text-violet-800 hover:bg-violet-200",
    indigo: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    cyan: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
    teal: "bg-teal-100 text-teal-800 hover:bg-teal-200",
  };
  return (
    <button
      onClick={onClick}
      className={`btn-press relative rounded-xl ${tones[tone]} h-16 sm:h-20 px-3 py-2 text-center`}
    >
      <div
        className={`font-bold ${big ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
      >
        {label}
      </div>
      {sub && (
        <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {sub}
        </div>
      )}
    </button>
  );
}

function ControlButton({ label, sub, onClick, tone }) {
  const tones = {
    purple: "bg-violet-50 text-violet-800 hover:bg-violet-100",
    indigo: "bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
    cyan: "bg-cyan-50 text-cyan-800 hover:bg-cyan-100",
    teal: "bg-teal-50 text-teal-800 hover:bg-teal-100",
  };
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-xl ${tones[tone]} h-16 sm:h-20 px-3 py-2 text-center`}
    >
      <div className="text-sm font-bold">{label}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {sub}
      </div>
    </button>
  );
}

function ActionButton({ label, onClick, tone, fullWidth }) {
  const tones = {
    default: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    amber: "bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-200",
    pitch: "bg-pitch-700 text-white hover:bg-pitch-800 border-pitch-700",
  };
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-xl border px-3 py-2 text-sm font-medium ${
        tones[tone || "default"]
      } ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
