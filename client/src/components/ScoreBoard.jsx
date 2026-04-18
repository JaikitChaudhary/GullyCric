import { useEffect, useState } from 'react';

function ScoreBoard({ match }) {
  const scoreText = `${match.totalRuns}/${match.wickets}`;
  const [isScoreAnimated, setIsScoreAnimated] = useState(false);
  const statusText = match.isCompleted ? 'Completed' : 'In Progress';
  const detailItems = [
    { label: 'Overs', value: match.currentOver },
    { label: 'Innings', value: match.innings },
    { label: 'Target', value: match.target || '-' },
    { label: 'Status', value: statusText },
  ];

  useEffect(() => {
    setIsScoreAnimated(true);
    const timeoutId = window.setTimeout(() => setIsScoreAnimated(false), 550);

    return () => window.clearTimeout(timeoutId);
  }, [match.totalRuns, match.wickets, match.currentOver]);

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-orange-400/15 bg-slate-950/70 p-6 text-slate-200 shadow-[0_28px_90px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-orange-500/12 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-12 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative text-center">
          <p className="text-xs uppercase tracking-[0.38em] text-orange-200/70">Live Score</p>
          <h2
            className={`mt-4 text-5xl font-black tracking-tight text-white drop-shadow-[0_0_22px_rgba(249,115,22,0.2)] sm:text-6xl md:text-7xl ${isScoreAnimated ? 'animate-score-pop' : ''}`}
          >
            {scoreText}
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            {match.name}
            {match.result ? ` • ${match.result}` : ''}
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 text-center text-slate-300 sm:grid-cols-4">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur"
            >
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-base font-semibold text-white sm:text-lg">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {match.result && (
        <div className="mb-6 rounded-[1.5rem] border border-orange-300/20 bg-orange-400/10 p-4 text-orange-50 shadow-[0_16px_40px_rgba(249,115,22,0.08)] animate-rise-in">
          {match.result}
        </div>
      )}
    </>
  );
}

export default ScoreBoard;
