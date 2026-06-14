import React, { useMemo, useRef, useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import { fetchMatchesApi, startMatchApi, addBallApi, updateMatchApi } from "./api";
import useStore from "./store";
import Header from "./components/Header";
import Home from "./components/Home";
import MatchSetup from "./components/MatchSetup";
import LiveMatch from "./components/LiveMatch";
import MatchSummary from "./components/MatchSummary";
import History from "./components/History";
import Stats from "./components/Stats";
import Footer from "./components/Footer";

const SESSION_KEY = "gully-auth-session";

export default function App() {
  const currentMatch = useStore((s) => s.currentMatch);
  const matches = useStore((s) => s.matches);
  const startMatch = useStore((s) => s.startMatch);
  const cancelMatch = useStore((s) => s.cancelMatch);
  const addBall = useStore((s) => s.addBall);
  const undoBall = useStore((s) => s.undoBall);
  const rotateStrike = useStore((s) => s.rotateStrike);
  const setBowler = useStore((s) => s.setBowler);
  const setStriker = useStore((s) => s.setStriker);
  const endInning = useStore((s) => s.endInning);
  const beginSecondInningIfReady = useStore((s) => s.beginSecondInningIfReady);
  const deleteMatch = useStore((s) => s.deleteMatch);
  const clearAllMatches = useStore((s) => s.clearAllMatches);

  const [view, setView] = useState("home");
  const [summaryMatch, setSummaryMatch] = useState(null);
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const prevMatchCountRef = useRef(matches.length);

  useEffect(() => {
    if (authUser?.gullyId) {
      useStore.getState().setGullyId(authUser.gullyId);
      fetchMatchesApi(authUser.gullyId)
        .then(data => {
          const allMapped = data.filter(d => d.frontendData).map(d => d.frontendData);
          const completedMatches = allMapped.filter(m => m.status === 'completed');
          const inProgress = allMapped.find(m => m.status === 'in-progress');
          
          useStore.getState().setMatches(completedMatches);
          
          if (inProgress && !useStore.getState().currentMatch) {
            useStore.setState({ currentMatch: inProgress });
          }
        })
        .catch(console.error);
    }
  }, [authUser]);

  // If we have a current match, route into live view.
  useEffect(() => {
    if (currentMatch) {
      if (view === "home" || view === "setup") setView("live");
    }
  }, [currentMatch, view]);

  // When a match is auto-archived after the final ball, open the summary screen.
  useEffect(() => {
    const prev = prevMatchCountRef.current;
    if (matches.length > prev) {
      const last = matches[matches.length - 1];
      if (last && view === "live") {
        setSummaryMatch(last);
        setView("summary");
      }
    }
    prevMatchCountRef.current = matches.length;
  }, [matches, view]);

  const isAuthenticated = Boolean(authUser);

  const handleStartMatch = async (cfg) => {
    try {
      const res = await startMatchApi(authUser.gullyId, {
        teamA: cfg.teamA,
        teamB: cfg.teamB,
        tossWinnerIndex: cfg.tossWinnerIndex,
        tossChoice: cfg.tossChoice,
        matchData: cfg
      });
      cfg.id = res.matchId;
      startMatch(cfg);
      setView("live");
      const initializedMatch = useStore.getState().currentMatch;
      updateMatchApi(authUser.gullyId, res.matchId, { frontendData: initializedMatch }).catch(console.error);
    } catch (err) {
      console.error(err);
      alert("Failed to start match");
    }
  };

  const handleLiveBall = async (ballObj) => {
    const mBefore = useStore.getState().currentMatch;
    if (!mBefore) return;
    const matchId = mBefore.id;
    
    addBall(ballObj);
    const mAfter = useStore.getState().currentMatch;

    try {
      await addBallApi(authUser.gullyId, matchId, {
        runs: ballObj.runs || Number(ballObj.event) || 0,
        wicket: ballObj.event === 'W'
      });
      
      if (mAfter) {
        await updateMatchApi(authUser.gullyId, matchId, { frontendData: mAfter });
      } else {
        const last = useStore.getState().matches.slice(-1)[0];
        if (last && last.id === matchId) {
          await updateMatchApi(authUser.gullyId, matchId, { frontendData: last, status: 'completed', result: last.result });
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleEndInning = async () => {
    const result = endInning();
    const m = useStore.getState().currentMatch;
    
    if (result?.startedInningsBreak && m) {
      updateMatchApi(authUser.gullyId, m.id, { frontendData: m }).catch(console.error);
      setView("live");
    } else if (result?.archived) {
      setTimeout(async () => {
        const last = useStore.getState().matches.slice(-1)[0];
        if (last) {
          await updateMatchApi(authUser.gullyId, last.id, { frontendData: last, status: 'completed', result: last.result }).catch(console.error);
          setSummaryMatch(last);
          setView("summary");
        }
      }, 50);
    }
  };

  const handleNav = (target) => {
    // target may be "setup" | "history" | "stats" | "home"
    setSummaryMatch(null);
    setView(target || "home");
  };

  const handleBreakComplete = () => {
    beginSecondInningIfReady();
  };

  const handleAuthSuccess = (user) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setAuthUser(user);
  };

  const handleSignOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthUser(null);
    setView("home");
    setSummaryMatch(null);
  };

  const handleDeleteMatch = (matchId) => {
    deleteMatch(matchId);
    import("./api").then(({ deleteMatchApi }) => 
      deleteMatchApi(authUser.gullyId, matchId).catch(console.error)
    );
  };

  const handleClearAllMatches = () => {
    matches.forEach(m => handleDeleteMatch(m.id));
    clearAllMatches();
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-500 selection:text-white">
      <Header onHome={handleNav} />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end px-4 pt-3 sm:px-6">
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:text-rose-600"
        >
          Sign out ({authUser.name})
        </button>
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
        {view === "home" && (
          <Home
            onNewMatch={() => setView("setup")}
            onHistory={() => setView("history")}
            onStats={() => setView("stats")}
            onResume={() => setView("live")}
            hasCurrentMatch={Boolean(currentMatch)}
          />
        )}

        {view === "setup" && (
          <MatchSetup
            onStart={handleStartMatch}
            onCancel={() => setView("home")}
          />
        )}

        {view === "live" && currentMatch && (
          <LiveMatch
            match={currentMatch}
            onBall={handleLiveBall}
            onUndo={undoBall}
            onRotateStrike={rotateStrike}
            onSetBowler={setBowler}
            onSetStriker={setStriker}
            onBreakComplete={handleBreakComplete}
            onEndInning={handleEndInning}
            onCancel={() => {
              if (
                confirm(
                  "Cancel current match? All ball-by-ball data will be lost.",
                )
              ) {
                const matchId = currentMatch.id;
                cancelMatch();
                setView("home");
                import("./api").then(({ deleteMatchApi }) => 
                  deleteMatchApi(authUser.gullyId, matchId).catch(console.error)
                );
              }
            }}
          />
        )}

        {view === "history" && (
          <History
            matches={matches}
            onOpen={(m) => {
              setSummaryMatch(m);
              setView("summary");
            }}
            onDelete={handleDeleteMatch}
            onClearAll={handleClearAllMatches}
          />
        )}

        {view === "summary" && summaryMatch && (
          <MatchSummary
            match={summaryMatch}
            onBack={() => {
              setSummaryMatch(null);
              setView("history");
            }}
            onDelete={(id) => {
              handleDeleteMatch(id || summaryMatch.id);
              setSummaryMatch(null);
              setView("history");
            }}
          />
        )}

        {view === "stats" && <Stats matches={matches} />}
      </main>
      <Footer />
    </div>
  );
}

