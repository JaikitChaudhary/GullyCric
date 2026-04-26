import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function getShortName(teamName) {
  if (!teamName) return 'TBD';

  const words = teamName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  return teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'TBD';
}

function ScoreSwap({ value, className }) {
  return (
    <span className={`relative inline-flex min-w-0 overflow-hidden ${className || ''}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 18, opacity: 0, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -18, opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function OverBallChip({ value }) {
  const isWicket = value === 'W';

  return (
    <span
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
        isWicket
          ? 'border-rose-400/30 bg-rose-500/20 text-rose-100'
          : 'border-cyan-300/12 bg-white/[0.05] text-slate-100'
      }`}
    >
      {value}
    </span>
  );
}

function StickyScoreBar({
  teamA,
  teamB,
  score,
  overs,
  status,
  overBalls = [],
  isLive = true,
  onClick,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  }, [isMobile]);

  const canExpand = isMobile;
  const visibleOverBalls = overBalls.length > 0 ? overBalls : ['-'];

  return (
    <motion.div
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 ${className}`}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-2 sm:px-3">
        <motion.div
          whileTap={onClick ? { scale: 0.995 } : undefined}
          onClick={onClick}
          onKeyDown={(event) => {
            if (!onClick) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick();
            }
          }}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          className={`relative overflow-hidden border border-cyan-300/10 bg-gradient-to-r from-black/88 via-slate-950/84 to-[#061a38]/88 shadow-[0_18px_50px_rgba(2,6,23,0.55),0_0_0_1px_rgba(125,211,252,0.08),0_0_36px_rgba(56,189,248,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/68 ${onClick ? 'cursor-pointer' : ''} ${canExpand && isExpanded ? 'rounded-b-[1.35rem]' : 'rounded-b-2xl md:rounded-b-[1.35rem]'}`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
          <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-6 top-4 h-16 w-16 rounded-full bg-rose-500/10 blur-2xl" />

          <div className="flex min-h-[50px] items-center gap-1 px-2 py-2 sm:min-h-[60px] sm:gap-2 sm:px-4">
            <div className="min-w-0 flex-0 flex-shrink-0">
              <div className="flex items-center gap-1">
                {isLive && (
                  <div className="hidden items-center gap-1 sm:flex">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.75)]" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-200">LIVE</span>
                  </div>
                )}
                <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {getShortName(teamA)}
                </p>
              </div>
              <div className="mt-1 flex items-end gap-1 sm:gap-2">
                <ScoreSwap
                  value={score || '--/--'}
                  className="text-lg font-black tracking-tight text-white sm:text-2xl"
                />
                <ScoreSwap
                  value={`${overs || '0.0'} ov`}
                  className="pb-0.5 text-xs font-medium text-slate-300 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 px-1 text-center sm:px-2">
              <div className="flex items-center justify-center gap-2">
                {isLive && (
                  <div className="flex items-center gap-1.5 sm:hidden">
                    <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-red-200">LIVE</span>
                  </div>
                )}
                <p className="line-clamp-2 text-[10px] font-semibold leading-3 text-slate-100 sm:text-xs sm:leading-4">
                  {status || 'Match status unavailable'}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-0 flex-shrink-0 text-right">
              <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {getShortName(teamB)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200 sm:text-base">{teamB || 'Team B'}</p>
            </div>

            {canExpand && (
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse over details' : 'Expand over details'}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsExpanded((value) => !value);
                }}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {(!canExpand || isExpanded) && (
              <motion.div
                initial={canExpand ? { height: 0, opacity: 0 } : false}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="overflow-hidden border-t border-white/8"
              >
                <div className="flex flex-col gap-2 px-3 py-3 md:px-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">This Over</p>
                    <p className="text-[11px] text-slate-400">{visibleOverBalls.length} ball{visibleOverBalls.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleOverBalls.map((ball, index) => (
                      <OverBallChip key={`${ball}-${index}`} value={ball} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StickyScoreBar;
