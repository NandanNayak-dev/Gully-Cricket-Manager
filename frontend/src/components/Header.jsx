import React from "react";

export default function Header({ onHome }) {
  return (
    <header className="sticky top-0 z-20 border-b border-pitch-100 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={onHome}
          className="group flex items-center gap-3 rounded-xl p-1 -m-1 text-left"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-700 text-white shadow-md shadow-pitch-700/20">
            <CricketIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-pitch-800">
              Gully Cricket
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-pitch-700/70">
              Match Record
            </p>
          </div>
        </button>
        <nav className="hidden gap-1 sm:flex">
          <Pill label="New Match" onClick={() => onHome("setup")} />
          <Pill label="History" onClick={() => onHome("history")} />
          <Pill label="Stats" onClick={() => onHome("stats")} />
        </nav>
        <button
          onClick={onHome}
          className="rounded-lg border border-pitch-200 bg-white px-3 py-1.5 text-xs font-medium text-pitch-800 hover:bg-pitch-50 sm:hidden"
        >
          Home
        </button>
      </div>
    </header>
  );
}

function Pill({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-pitch-800/80 hover:bg-pitch-100/70"
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
