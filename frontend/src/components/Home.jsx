import React from "react";

export default function Home({
  onNewMatch,
  onHistory,
  onStats,
  onResume,
  hasCurrentMatch,
}) {
  return (
    <div className="space-y-6 sm:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-pitch-100 bg-gradient-to-br from-pitch-600 via-pitch-700 to-pitch-900 p-6 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-72 w-72 rounded-full bg-pitch-300/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pitch-100/80">
            Gully cricket scorer
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Score your street match like a pro
          </h1>
          <p className="mt-3 max-w-xl text-sm text-pitch-50/90 sm:text-base">
            Track every ball, manage overs & wickets, record player stats, and
            revisit every gully classic you've ever played. Built for the
            maidans, gallis, and terrace tournaments.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onNewMatch}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-pitch-800 shadow-lg shadow-pitch-900/30 hover:bg-pitch-50"
            >
              <span>Start a match</span>
              <span aria-hidden>→</span>
            </button>
          {hasCurrentMatch && (
            <button
              onClick={onResume}
              className="btn-press rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
            >
              Resume current match →
            </button>
          )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          title="Ball-by-ball scoring"
          desc="Runs, wickets, wides, no-balls, byes & leg byes. Auto-striker rotation."
          tag="Scoring"
          accent="from-amber-300 to-orange-400"
          onClick={onNewMatch}
        />
        <FeatureCard
          title="Match history"
          desc="Every match saved locally. Filter by team and revisit classic finishes."
          tag="History"
          accent="from-sky-300 to-indigo-500"
          onClick={onHistory}
        />
        <FeatureCard
          title="Player & team stats"
          desc="Top run-scorers, most wickets, highest partnerships, averages & SR."
          tag="Stats"
          accent="from-rose-300 to-fuchsia-500"
          onClick={onStats}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tip title="Toss" text="Good coin toss luck decides street matches before the first ball." />
        <Tip title="Last-man" text="In 8+ player teams, the last batter bats alone — handle with care." />
        <Tip title="Wide calls" text="No extra ball in gully cricket — wides add 1 and keep the tally clean." />
      </section>
    </div>
  );
}

function FeatureCard({ title, desc, tag, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-xl transition group-hover:opacity-40`}
      />
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tag}</div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </button>
  );
}

function Tip({ title, text }) {
  return (
    <div className="rounded-2xl border border-pitch-100 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700/80">
        {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
