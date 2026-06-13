import React, { useMemo, useRef, useState, useEffect } from "react";
import useStore from "./store";
import Header from "./components/Header";
import Home from "./components/Home";
import MatchSetup from "./components/MatchSetup";
import LiveMatch from "./components/LiveMatch";
import MatchSummary from "./components/MatchSummary";
import History from "./components/History";
import Stats from "./components/Stats";

const SESSION_KEY = "gully-auth-session";
const USERS_KEY = "gully-auth-users";

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
  const prevMatchCountRef = useRef(matches.length);
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  });

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

  const handleStartMatch = (cfg) => {
    startMatch(cfg);
    setView("live");
  };

  const handleLiveBall = (ballObj) => {
    addBall(ballObj);
  };

  const handleEndInning = () => {
    const result = endInning();
    if (result?.startedInningsBreak) {
      setView("live");
    } else if (result?.archived) {
      // Re-open the latest match in summary view
      setTimeout(() => {
        const last = useStore.getState().matches.slice(-1)[0];
        if (last) {
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

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header onHome={handleNav} />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end px-4 pt-3 sm:px-6">
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
                cancelMatch();
                setView("home");
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
            onDelete={deleteMatch}
            onClearAll={clearAllMatches}
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
              deleteMatch(id || summaryMatch.id);
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

function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === "signup" && !name.trim()) return false;
    return true;
  }, [mode, name, email, password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const users = readUsers();

    if (mode === "signup") {
      const already = users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (already) {
        setError("This email is already registered. Please sign in.");
        return;
      }
      const nextUser = {
        id: `${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      const nextUsers = [...users, nextUser];
      localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
      onAuthSuccess({ id: nextUser.id, name: nextUser.name, email: nextUser.email });
      return;
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    );

    if (!found) {
      setError("Invalid email or password.");
      return;
    }

    onAuthSuccess({ id: found.id, name: found.name, email: found.email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pitch-800 via-pitch-700 to-pitch-900 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm">
        <div className="grid min-h-[640px] md:grid-cols-2">
          <div className="flex flex-col justify-between p-8 md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch-100/80">
                Gully Cricket
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Match record handling
              </h1>
              <p className="mt-3 max-w-md text-sm text-pitch-50/85">
                Sign in to manage your matches, track ball-by-ball scoring, and keep
                your gully cricket history in one place.
              </p>
            </div>
            <p className="text-xs text-pitch-100/70">
              Project workspace label requested: frontend
            </p>
          </div>

          <div className="flex items-center bg-white p-6 text-slate-900 sm:p-10">
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    mode === "signin" ? "bg-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    mode === "signup" ? "bg-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {mode === "signup" && (
                <Field label="Full name" value={name} onChange={setName} type="text" />
              )}

              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
              />

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl bg-pitch-700 px-4 py-2.5 text-sm font-semibold text-white enabled:hover:bg-pitch-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-pitch-400 focus:ring-2 focus:ring-pitch-100"
      />
    </label>
  );
}

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-pitch-100 bg-white/40 py-5 text-center text-xs text-slate-500">
      <p>
        Gully Cricket - built for streets, maidans, and terrace tournaments
      </p>
    </footer>
  );
}
