import React from "react";

export default function Header({ onHome }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => onHome("home")}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <img src="/assets/logo.png" alt="Mohalla Logo" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
          <div className="leading-none ml-1">
            <p className="text-xl font-bold tracking-tight text-slate-900">
              Mohalla
            </p>
          </div>
        </button>
        <nav className="hidden items-center gap-4 sm:flex">
          <Pill label="New Match" onClick={() => onHome("setup")} highlight />
          <Pill label="History" onClick={() => onHome("history")} />
          <Pill label="Stats" onClick={() => onHome("stats")} />
        </nav>
        <button
          onClick={() => onHome("home")}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white sm:hidden"
        >
          Home
        </button>
      </div>
    </header>
  );
}

function Pill({ label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        highlight 
          ? "bg-slate-900 text-white hover:bg-slate-800" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

export function CricketIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 19l10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14 5l3 3M3 21l2-2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="4.5" r="1.6" fill="currentColor" />
    </svg>
  );
}
