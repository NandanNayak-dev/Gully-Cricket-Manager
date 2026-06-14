import React from "react";

export default function Home({
  onNewMatch,
  onHistory,
  onStats,
  onResume,
  hasCurrentMatch,
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-12 pt-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 pt-8 pb-4 shadow-xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: 'url("/assets/home_banner.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="relative flex flex-col items-start px-8 py-12 sm:px-12 sm:py-20">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Score your street match.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Track every ball, manage overs & wickets, record player stats, and
            revisit every mohalla classic you've ever played. Built for the
            maidans, gallis, and terrace tournaments.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={onNewMatch}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
            >
              Start a match
            </button>
            {hasCurrentMatch && (
              <button
                onClick={onResume}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20"
              >
                Resume match
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="Ball-by-ball scoring"
          desc="Runs, wickets, wides, no-balls, byes & leg byes. Auto-striker rotation."
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          onClick={onNewMatch}
        />
        <FeatureCard
          title="Match history"
          desc="Every match securely saved. Filter by team and revisit classic finishes."
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          onClick={onHistory}
        />
        <FeatureCard
          title="Player & team stats"
          desc="Top run-scorers, most wickets, highest partnerships, averages & SR."
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          onClick={onStats}
        />
      </section>

      {/* Tips */}
      <section className="grid gap-6 sm:grid-cols-3">
        <Tip title="The Toss" text="Good coin toss luck decides street matches before the first ball is even bowled." />
        <Tip title="Last-Man Standing" text="In 8+ player teams, the last batter bats alone — handle with care." />
        <Tip title="Mohalla Wides" text="No extra ball in mohalla cricket — wides simply add 1 and keep the tally clean." />
      </section>
    </div>
  );
}

function FeatureCard({ title, desc, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-700">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </button>
  );
}

function Tip({ title, text }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-6">
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}
