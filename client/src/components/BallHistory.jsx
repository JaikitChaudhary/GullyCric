import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

function formatBallValue(entry) {
  if (entry?.type === 'wicket') {
    return 'W';
  }

  if (entry?.type === 'wide' || entry?.type === 'WD') {
    return 'WD';
  }

  return String(entry?.runs ?? entry?.value ?? 0);
}

function getBallTone(value) {
  if (value === 'W') {
    return 'border-rose-400/30 bg-rose-500/20 text-rose-100';
  }

  if (value === 'WD') {
    return 'border-amber-300/35 bg-amber-400/20 text-amber-50';
  }

  if (value === '4' || value === '6') {
    return 'border-emerald-400/30 bg-emerald-500/18 text-emerald-100';
  }

  return 'border-white/10 bg-white/[0.04] text-slate-100';
}

function BallHistory({ history = [] }) {
  const [showAll, setShowAll] = useState(false);

  const balls = useMemo(
    () =>
      history.map((entry, index) => {
        const value = formatBallValue(entry);
        return {
          id: `${entry?.type || 'ball'}-${index}-${value}`,
          value,
        };
      }),
    [history]
  );

  const visibleBalls = showAll ? balls : balls.slice(-6);
  const lastBall = balls.at(-1)?.value || '-';

  return (
    <section className="rounded-[1.75rem] border border-orange-300/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Ball History</p>
          <p className="mt-2 text-sm font-medium text-slate-300">Last Ball: <span className="text-white">{lastBall}</span></p>
        </div>
        {balls.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.08]"
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={showAll ? 'full' : 'compact'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mt-5 flex flex-wrap gap-2"
        >
          {visibleBalls.length > 0 ? (
            visibleBalls.map((ball) => (
              <motion.span
                key={ball.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${getBallTone(ball.value)}`}
              >
                {ball.value}
              </motion.span>
            ))
          ) : (
            <p className="text-sm text-slate-400">No balls recorded yet.</p>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default BallHistory;
