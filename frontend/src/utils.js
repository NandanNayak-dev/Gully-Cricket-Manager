// Cricket scoring utilities shared across the app.

export const BALL_EVENTS = {
  DOT: "dot",
  SINGLE: "1",
  DOUBLE: "2",
  THREE: "3",
  FOUR: "4",
  SIX: "6",
  WIDE: "wd",
  NO_BALL: "nb",
  BYE: "b",
  LEG_BYE: "lb",
  WICKET: "W",
};

export const WICKET_TYPES = [
  "Bowled",
  "Caught",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
];

export function formatOvers(balls) {
  if (balls == null) return "0.0";
  const overs = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${overs}.${rem}`;
}

export function runRate(runs, balls) {
  if (!balls) return 0;
  return (runs / balls) * 6;
}

export function requiredRunRate(target, runs, ballsRemaining) {
  if (!ballsRemaining || ballsRemaining <= 0) return 0;
  const need = target - runs + 1;
  if (need <= 0) return 0;
  return (need / ballsRemaining) * 6;
}

export function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

// Reduce a ball-by-ball list into inning aggregates.
export function summarizeInning(balls) {
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;
  let fours = 0;
  let sixes = 0;
  const wicketTypes = {};

  for (const b of balls) {
    const e = b.event;
    if (e === "wd") {
      const r = b.runs || 1;
      wides += r;
      runs += r;
      continue;
    }
    if (e === "nb") {
      noBalls += 1;
      const r = b.runs || 0;
      runs += 1 + r;
      if (r === 4) fours += 1;
      if (r === 6) sixes += 1;
      continue;
    }
    legalBalls += 1;
    if (e === "b") {
      byes += b.runs || 0;
      runs += b.runs || 0;
    } else if (e === "lb") {
      legByes += b.runs || 0;
      runs += b.runs || 0;
    } else if (e === "W") {
      wickets += 1;
      const type = b.wicketType || "Wicket";
      wicketTypes[type] = (wicketTypes[type] || 0) + 1;
    } else {
      const r = Number(e) || 0;
      runs += r;
      if (r === 4) fours += 1;
      if (r === 6) sixes += 1;
    }
  }

  return {
    runs,
    wickets,
    balls: legalBalls,
    overs: formatOvers(legalBalls),
    runRate: runRate(runs, legalBalls),
    wides,
    noBalls,
    byes,
    legByes,
    extras: wides + noBalls + byes + legByes,
    fours,
    sixes,
    wicketTypes,
  };
}

// Stats per batter in the inning
export function batterStats(balls, playerId) {
  let runs = 0;
  let ballsFaced = 0;
  let fours = 0;
  let sixes = 0;
  for (const b of balls) {
    if (b.event === "wd") continue;
    if (b.strikerId !== playerId) continue;
    ballsFaced += 1;
    if (b.event === "W") continue;
    if (b.event === "b" || b.event === "lb") continue;
    if (b.event === "nb") {
      const r = b.runs || 0;
      runs += r;
      if (r === 4) fours += 1;
      if (r === 6) sixes += 1;
    } else {
      const r = Number(b.event) || 0;
      runs += r;
      if (r === 4) fours += 1;
      if (r === 6) sixes += 1;
    }
  }
  return {
    runs,
    ballsFaced,
    fours,
    sixes,
    sr: ballsFaced ? ((runs / ballsFaced) * 100).toFixed(2) : "0.00",
    out: balls.some((b) => b.event === "W" && b.strikerId === playerId),
  };
}

// Stats per bowler in the inning
export function bowlerStats(balls, playerId) {
  let runs = 0;
  let legalBalls = 0;
  let wickets = 0;
  let wides = 0;
  let noBalls = 0;
  for (const b of balls) {
    if (b.bowlerId !== playerId) continue;
    if (b.event === "wd") {
      wides += b.runs || 1;
      runs += b.runs || 1;
      continue;
    }
    if (b.event === "nb") {
      noBalls += 1;
      runs += 1 + (b.runs || 0);
      continue;
    }
    legalBalls += 1;
    if (b.event === "b" || b.event === "lb") {
      runs += b.runs || 0;
    } else if (b.event === "W") {
      wickets += 1;
    } else {
      runs += Number(b.event) || 0;
    }
  }
  const overs = formatOvers(legalBalls);
  return {
    runs,
    legalBalls,
    overs,
    wickets,
    wides,
    noBalls,
    economy: runRate(runs, legalBalls) || 0,
  };
}

// Balls in the current over for display (last 6 legal balls)
export function currentOverBalls(balls) {
  const legal = balls.filter((b) => b.event !== "wd" && b.event !== "nb");
  return legal.slice(-6);
}

// Partnership since last wicket or start of innings
export function partnership(balls, inn, battingTeam) {
  let lastWicketIdx = -1;
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].event === "W") lastWicketIdx = i;
  }
  const seg = balls.slice(lastWicketIdx + 1);
  const strikerId = seg.length
    ? seg[0].strikerId
    : inn.strikerId;
  const nonStrikerId = seg.length
    ? seg[0].nonStrikerId
    : inn.nonStrikerId;
  let runs = 0;
  let legalBalls = 0;
  for (const b of seg) {
    if (b.event === "wd") {
      runs += b.runs || 1;
      continue;
    }
    if (b.event === "nb") {
      runs += 1 + (b.runs || 0);
      continue;
    }
    legalBalls += 1;
    if (b.event === "b" || b.event === "lb") {
      runs += b.runs || 0;
    } else if (b.event !== "W") {
      runs += Number(b.event) || 0;
    }
  }
  const striker = battingTeam.players.find((p) => p.id === strikerId);
  const nonStriker = battingTeam.players.find((p) => p.id === nonStrikerId);
  return {
    striker,
    nonStriker,
    runs,
    balls: legalBalls,
    overs: formatOvers(legalBalls),
  };
}

export function lastBall(balls) {
  return balls.length ? balls[balls.length - 1] : null;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
