import React, { useState, useMemo } from "react";

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim() || !password.trim()) return false;
    return true;
  }, [name, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gullyName: name.trim(), password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.msg || "Registration failed");
          return;
        }
        onAuthSuccess({ id: data._id, name: data.gullyName, gullyId: data._id });
      } else {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gullyName: name.trim() || email.trim(), password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.msg || "Invalid credentials");
          return;
        }
        onAuthSuccess({ id: data._id, name: data.gullyName, gullyId: data._id });
      }
    } catch (err) {
      setError("Server connection failed.");
    }
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

              <Field label="Gully Name" value={name} onChange={setName} type="text" />
              
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
