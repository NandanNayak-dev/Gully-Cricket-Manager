import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  (set, get) => ({
    gullyId: null,
    setGullyId: (id) => set({ gullyId: id }),
    currentMatch: null,
    matches: [],
    setMatches: (fetched) => set({ matches: fetched }),

    startMatch: (cfg) => {
        const now = Date.now();
        const match = {
          id: makeId(),
          createdAt: now,
          finishedAt: null,
          breakUntil: null,
          breakType: null,
          overs: cfg.overs,
          playersPerTeam: cfg.playersPerTeam,
          tossWinnerIndex: cfg.tossWinnerIndex,
          tossChoice: cfg.tossChoice,
          teams: [cfg.teamA, cfg.teamB],
          innings: [buildFirstInning(cfg.teamA, cfg.teamB, cfg.firstBattingIndex)],
          currentInningIndex: 0,
          status: "in-progress",
          result: null,
        };
        set({ currentMatch: match });
      },

      cancelMatch: () => set({ currentMatch: null }),

      addBall: (eventObj) => {
        const m = get().currentMatch;
        if (!m) return;
        if (m.breakUntil && Date.now() < m.breakUntil) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn || inn.closed) return;

        const before = inningSummary(inn.balls, m.overs, m.playersPerTeam);
        const target = idx === 1 ? inningTotal(m.innings[0]?.balls || []) + 1 : null;
        if (isInningComplete(before, target)) return;

        const ball = {
          ...eventObj,
          _prevStrikerId: inn.strikerId,
          _prevNonStrikerId: inn.nonStrikerId,
          _prevBowlerId: inn.bowlerId,
        };
        const updatedInn = { ...inn, balls: [...inn.balls, ball] };

        const r = Number(eventObj.event);
        const shouldSwap =
          r === 1 ||
          r === 3 ||
          (eventObj.event === "nb" && (eventObj.runs === 1 || eventObj.runs === 3));
        if (shouldSwap) {
          const t = updatedInn.strikerId;
          updatedInn.strikerId = updatedInn.nonStrikerId;
          updatedInn.nonStrikerId = t;
        }

        const nextMatch = {
          ...m,
          innings: m.innings.map((x, i) => (i === idx ? updatedInn : x)),
        };

        const advanced = advanceIfCompleted(nextMatch);
        if (advanced.archivedMatch) {
          set({
            matches: [...get().matches, advanced.archivedMatch],
            currentMatch: null,
          });
          return;
        }

        set({ currentMatch: advanced.match });
      },

      undoBall: () => {
        const m = get().currentMatch;
        if (!m) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn || inn.balls.length === 0) return;
        const last = inn.balls[inn.balls.length - 1];

        const updatedInn = {
          ...inn,
          balls: inn.balls.slice(0, -1),
          strikerId: last._prevStrikerId ?? inn.strikerId,
          nonStrikerId: last._prevNonStrikerId ?? inn.nonStrikerId,
          bowlerId: last._prevBowlerId ?? inn.bowlerId,
        };

        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) => (i === idx ? updatedInn : x)),
          },
        });
      },

      swapStrike: () => {
        const m = get().currentMatch;
        if (!m) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn) return;
        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) =>
              i === idx
                ? {
                    ...inn,
                    strikerId: inn.nonStrikerId,
                    nonStrikerId: inn.strikerId,
                  }
                : x,
            ),
          },
        });
      },

      rotateStrike: () => get().swapStrike(),

      setBowler: (playerId) => {
        const m = get().currentMatch;
        if (!m || !playerId) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn) return;
        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) =>
              i === idx ? { ...inn, bowlerId: playerId } : x,
            ),
          },
        });
      },

      setStriker: (playerId) => {
        const m = get().currentMatch;
        if (!m || !playerId) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn || playerId === inn.nonStrikerId) return;
        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) =>
              i === idx ? { ...inn, strikerId: playerId } : x,
            ),
          },
        });
      },

      setNonStriker: (playerId) => {
        const m = get().currentMatch;
        if (!m || !playerId) return;
        const idx = m.currentInningIndex;
        const inn = m.innings[idx];
        if (!inn || playerId === inn.strikerId) return;
        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) =>
              i === idx ? { ...inn, nonStrikerId: playerId } : x,
            ),
          },
        });
      },

      // Manual fallback. Main inning transitions are automatic after each ball.
      endInning: () => {
        const m = get().currentMatch;
        if (!m) return null;
        const advanced = forceAdvance(m);
        if (advanced.archivedMatch) {
          set({
            matches: [...get().matches, advanced.archivedMatch],
            currentMatch: null,
          });
          return { archived: true };
        }
        set({ currentMatch: advanced.match });
        if (advanced.startedInningsBreak) return { startedInningsBreak: true };
        return { noChange: true };
      },

      setupSecondInning: ({ strikerId, nonStrikerId, bowlerId }) => {
        const m = get().currentMatch;
        if (!m || m.currentInningIndex !== 1) return;
        const inn = m.innings[1];
        if (!inn || inn.balls.length > 0) return;
        set({
          currentMatch: {
            ...m,
            innings: m.innings.map((x, i) =>
              i === 1
                ? {
                    ...inn,
                    strikerId: strikerId || inn.strikerId,
                    nonStrikerId: nonStrikerId || inn.nonStrikerId,
                    bowlerId: bowlerId || inn.bowlerId,
                  }
                : x,
            ),
          },
        });
      },

      beginSecondInningIfReady: () => {
        const m = get().currentMatch;
        if (!m) return false;
        if (m.currentInningIndex !== 0) return false;
        if (m.breakType !== "innings") return false;
        if (!m.breakUntil || Date.now() < m.breakUntil) return false;

        const second = buildSecondInning(m);
        set({
          currentMatch: {
            ...m,
            innings: [m.innings[0], second],
            currentInningIndex: 1,
            breakUntil: null,
            breakType: null,
          },
        });
        return true;
      },

      deleteMatch: (matchId) =>
        set({
          matches: get().matches.filter((m) => m.id !== matchId),
        }),

    })
);

function advanceIfCompleted(match) {
  const idx = match.currentInningIndex;
  const inn = match.innings[idx];
  const target = idx === 1 ? inningTotal(match.innings[0]?.balls || []) + 1 : null;
  const state = inningSummary(inn.balls, match.overs, match.playersPerTeam);
  if (!isInningComplete(state, target)) return { match };

  if (idx === 0) {
    const closedFirst = { ...inn, closed: true, closedAt: Date.now() };
    const breakUntil = Date.now() + 10_000;
    return {
      match: {
        ...match,
        innings: [closedFirst],
        currentInningIndex: 0,
        breakUntil,
        breakType: "innings",
      },
      startedInningsBreak: true,
    };
  }

  const closedSecond = { ...inn, closed: true, closedAt: Date.now() };
  const finished = finalizeMatch({
    ...match,
    innings: [match.innings[0], closedSecond],
    status: "completed",
    finishedAt: Date.now(),
    breakUntil: null,
    breakType: null,
  });
  return { archivedMatch: finished };
}

function forceAdvance(match) {
  const idx = match.currentInningIndex;
  if (idx === 0) {
    const first = match.innings[0];
    const closedFirst = { ...first, closed: true, closedAt: Date.now() };
    const breakUntil = Date.now() + 10_000;
    return {
      match: {
        ...match,
        innings: [closedFirst],
        currentInningIndex: 0,
        breakUntil,
        breakType: "innings",
      },
      startedInningsBreak: true,
    };
  }

  const second = match.innings[1];
  const closedSecond = { ...second, closed: true, closedAt: Date.now() };
  const finished = finalizeMatch({
    ...match,
    innings: [match.innings[0], closedSecond],
    status: "completed",
    finishedAt: Date.now(),
    breakUntil: null,
    breakType: null,
  });
  return { archivedMatch: finished };
}

function buildFirstInning(teamA, teamB, firstBattingIndex) {
  const batting = firstBattingIndex === 0 ? teamA : teamB;
  const bowling = firstBattingIndex === 0 ? teamB : teamA;
  return {
    battingTeamIndex: firstBattingIndex,
    strikerId: batting.players[0]?.id || null,
    nonStrikerId: batting.players[1]?.id || batting.players[0]?.id || null,
    bowlerId: bowling.players[0]?.id || null,
    balls: [],
    closed: false,
    closedAt: null,
  };
}

function buildSecondInning(match) {
  const firstBattingIndex = match.innings[0].battingTeamIndex;
  const secondBattingIndex = 1 - firstBattingIndex;
  const batting = match.teams[secondBattingIndex];
  const bowling = match.teams[firstBattingIndex];
  return {
    battingTeamIndex: secondBattingIndex,
    strikerId: batting.players[0]?.id || null,
    nonStrikerId: batting.players[1]?.id || batting.players[0]?.id || null,
    bowlerId: bowling.players[0]?.id || null,
    balls: [],
    closed: false,
    closedAt: null,
  };
}

function inningSummary(balls, overs, playersPerTeam) {
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  for (const b of balls) {
    if (b.event === "wd") {
      runs += b.runs || 1;
      continue;
    }
    if (b.event === "nb") {
      runs += 1 + (b.runs || 0);
      continue;
    }
    legalBalls += 1;
    if (b.event === "W") {
      wickets += 1;
      continue;
    }
    if (b.event === "b" || b.event === "lb") {
      runs += b.runs || 0;
      continue;
    }
    runs += Number(b.event) || 0;
  }

  return {
    runs,
    wickets,
    legalBalls,
    allOut: wickets >= Math.max(1, playersPerTeam - 1),
    oversDone: legalBalls >= overs * 6,
  };
}

function isInningComplete(summary, target) {
  if (summary.allOut || summary.oversDone) return true;
  if (target != null && summary.runs >= target) return true;
  return false;
}

function inningTotal(balls) {
  return inningSummary(balls, 999, 11).runs;
}

function finalizeMatch(match) {
  const first = match.innings[0];
  const second = match.innings[1];
  const firstRuns = inningTotal(first.balls);
  const secondRuns = inningTotal(second.balls);
  const secondWickets = second.balls.filter((b) => b.event === "W").length;
  const secondLegalBalls = second.balls.filter(
    (b) => b.event !== "wd" && b.event !== "nb",
  ).length;
  const maxBalls = match.overs * 6;
  const firstBatting = match.teams[first.battingTeamIndex];
  const secondBatting = match.teams[second.battingTeamIndex];

  let result;
  if (secondRuns > firstRuns) {
    const wicketsLeft = Math.max(0, match.playersPerTeam - 1 - secondWickets);
    const ballsLeft = Math.max(0, maxBalls - secondLegalBalls);
    result = `${secondBatting.name} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? "" : "s"} (${ballsLeft} ball${ballsLeft === 1 ? "" : "s"} left)`;
  } else if (secondRuns === firstRuns) {
    result = "Match tied";
  } else {
    const margin = firstRuns - secondRuns;
    result = `${firstBatting.name} won by ${margin} run${margin === 1 ? "" : "s"}`;
  }

  return {
    ...match,
    status: "completed",
    result,
  };
}

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default useStore;