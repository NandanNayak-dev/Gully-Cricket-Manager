import React, { useState, useMemo } from "react";

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!name.trim() || !password.trim()) return false;
    return true;
  }, [name, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gullyName: name.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || (mode === "signup" ? "Registration failed" : "Invalid credentials"));
        setIsLoading(false);
        return;
      }
      onAuthSuccess({ id: data._id, name: data.gullyName, gullyId: data._id });
    } catch (err) {
      setError("Server connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (

    <div className="flex min-h-screen bg-slate-50">
      {/* Left Panel: Hero / Branding */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-slate-900 px-8 py-12 text-white md:w-5/12 lg:px-12 lg:py-16">
        {/* Background Image / Overlay for Left Panel */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/assets/auth_hero.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        
        <div className="relative z-10">
          <div className="mb-6">
            <img src="/assets/logo.png" alt="Mohalla Logo" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Mohalla Cricket
          </div>
          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-white">
            Own the <br /> Streets.
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-slate-300">
            Experience the raw emotion of mohalla cricket. Manage your local tournaments, track ball-by-ball statistics, and etch your neighborhood legacy in stone.
          </p>
        </div>
        
        <div className="relative z-10 mt-12 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-emerald-500"></div>
              <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-blue-500"></div>
              <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-amber-500"></div>
            </div>
            <p className="text-sm font-medium text-slate-300">Join 10,000+ local champions</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === "signin" ? "Enter your details to access your dashboard." : "Get started by naming your neighborhood."}
            </p>
          </div>

          <div className="mb-8 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signin" 
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signup" 
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field 
              label="Mohalla Name" 
              value={name} 
              onChange={setName} 
              type="text" 
              placeholder="e.g. Bandra Blasters"
            />
            
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
            />

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <div className="flex">
                  <div className="ml-2">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-70 mt-2"
            >
              {isLoading ? "Authenticating..." : (mode === "signin" ? "Sign In" : "Create Account")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mt-1.5">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
        />
      </div>
    </div>
  );
}
