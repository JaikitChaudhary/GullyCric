import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;
const TOSS_FLIP_DURATION_SECONDS = 1.25;

function Toss() {
  const { code: matchCode } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [ownerToken, setOwnerToken] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipId, setFlipId] = useState(0);
  const [pendingTossWinner, setPendingTossWinner] = useState('');
  const [finalCoinRotation, setFinalCoinRotation] = useState(0);

  useEffect(() => {
    if (!matchCode) {
      return;
    }

    setOwnerToken(window.localStorage.getItem(getOwnerTokenStorageKey(matchCode)) || '');
  }, [matchCode]);

  useEffect(() => {
    const loadMatch = async () => {
      if (!matchCode) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/match/${matchCode}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch match');
          return;
        }

        setMatch(data);

        if (data.battingTeam && data.bowlingTeam) {
          navigate(`/match/${matchCode}`, { replace: true });
        }
      } catch (err) {
        setError('Server error while fetching match.');
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [matchCode, navigate]);

  const saveToss = async (payload) => {
    if (!matchCode) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/match/toss/${matchCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ownerToken ? { 'x-owner-token': ownerToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && matchCode) {
          window.localStorage.removeItem(getOwnerTokenStorageKey(matchCode));
          setOwnerToken('');
        }

        setError(data.error || 'Unable to save toss');
        return;
      }

      setMatch(data);
      navigate(`/match/${matchCode}`, { replace: true });
    } catch (err) {
      setError('Server error while saving toss.');
    } finally {
      setSaving(false);
    }
  };

  const handleFlipToss = () => {
    if (!match || isFlipping || saving) {
      return;
    }

    const teams = [match.teamAName || 'Team A', match.teamBName || 'Team B'];
    const nextWinner = teams[Math.floor(Math.random() * teams.length)];

    setError('');
    setTossWinner('');
    setPendingTossWinner(nextWinner);
    setFinalCoinRotation(nextWinner === teams[1] ? 1620 : 1440);
    setIsFlipping(true);
    setFlipId((current) => current + 1);
  };

  const handleFlipComplete = () => {
    if (!isFlipping || !pendingTossWinner) {
      return;
    }

    setTossWinner(pendingTossWinner);
    setPendingTossWinner('');
    setIsFlipping(false);
  };

  const handleDecision = (decision) => {
    if (!tossWinner) {
      setError('Flip the toss first.');
      return;
    }

    saveToss({ tossWinner, decision });
  };

  const handleSkipToss = () => {
    saveToss({ skipToss: true });
  };

  const teamAName = match?.teamAName || 'Team A';
  const teamBName = match?.teamBName || 'Team B';
  const canSetToss = ownerToken.length > 0;
  const coinRotation = isFlipping || tossWinner ? finalCoinRotation : 0;

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
        <div className="theme-surface-strong w-full rounded-[2rem] border p-5 backdrop-blur-xl sm:p-7">
          <header className="theme-surface mb-6 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo
                  alt="GullyCric logo"
                  priority
                  heightClassName="h-10 sm:h-11"
                  className="drop-shadow-[0_0_22px_rgba(249,115,22,0.18)]"
                />
                <p className="text-xs uppercase tracking-[0.3em] text-orange-200/70">Match Toss</p>
                <p className="mt-2 text-sm text-slate-300">Choose the innings order, or skip toss for a quick start.</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          {error && (
            <p className="mb-5 rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {loading && (
            <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-8 text-center text-slate-300">
              Loading toss...
            </section>
          )}

          {!loading && match && (
            <>
              {!canSetToss && (
                <div className="mb-5 rounded-[1.5rem] border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
                  View only mode. Only the match creator can set the toss.
                </div>
              )}

              <section className="theme-surface rounded-[1.75rem] border p-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                  <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.04] px-3 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Team A</p>
                    <p className="mt-2 text-base font-semibold text-white sm:text-lg">{teamAName}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200/80">vs</span>
                  <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.04] px-3 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Team B</p>
                    <p className="mt-2 text-base font-semibold text-white sm:text-lg">{teamBName}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleFlipToss}
                    disabled={!canSetToss || saving || isFlipping}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isFlipping ? 'Flipping...' : tossWinner ? 'Flip Again' : 'Flip Toss'}
                  </button>
                </div>

                <div className="relative mt-6 flex h-40 items-center justify-center [perspective:1000px]">
                  <motion.div
                    className="absolute bottom-7 h-4 w-20 rounded-full bg-black/35 blur-md"
                    animate={isFlipping
                      ? {
                          opacity: [0.28, 0.12, 0.18, 0.3],
                          scaleX: [1, 0.58, 0.76, 1],
                        }
                      : { opacity: 0.3, scaleX: 1 }}
                    transition={{
                      duration: TOSS_FLIP_DURATION_SECONDS,
                      ease: [0.2, 0.8, 0.2, 1],
                      times: [0, 0.38, 0.74, 1],
                    }}
                  />
                  <motion.div
                    key={flipId}
                    className="relative h-24 w-24 [transform-style:preserve-3d]"
                    initial={{ y: 0, rotateY: 0, rotateX: 0 }}
                    animate={isFlipping
                      ? {
                          y: [0, -42, -20, 0],
                          rotateY: [0, finalCoinRotation * 0.4, finalCoinRotation * 0.78, finalCoinRotation],
                          rotateX: [0, -7, 4, 0],
                        }
                      : {
                          y: 0,
                          rotateY: coinRotation,
                          rotateX: 0,
                        }}
                    transition={{
                      duration: TOSS_FLIP_DURATION_SECONDS,
                      ease: [0.2, 0.9, 0.2, 1],
                      times: [0, 0.38, 0.74, 1],
                    }}
                    onAnimationComplete={handleFlipComplete}
                  >
                    <div
                      className="absolute inset-0 rounded-full border border-amber-900/35 bg-amber-700/65 shadow-[inset_0_0_10px_rgba(69,26,3,0.45)]"
                      style={{ transform: 'translateZ(-3px)' }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-full border border-amber-100/60 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 text-2xl font-black text-slate-950 shadow-[0_18px_34px_rgba(2,6,23,0.32),inset_0_2px_8px_rgba(255,255,255,0.58),inset_0_-10px_18px_rgba(120,53,15,0.2)] [backface-visibility:hidden]"
                      style={{ transform: 'translateZ(3px)' }}
                    >
                      <span className="absolute inset-2 rounded-full border border-amber-800/20" />
                      <span className="absolute inset-4 rounded-full border border-white/35" />
                      <span>A</span>
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-full border border-amber-100/60 bg-gradient-to-br from-stone-100 via-amber-200 to-orange-400 text-2xl font-black text-slate-950 shadow-[0_18px_34px_rgba(2,6,23,0.32),inset_0_2px_8px_rgba(255,255,255,0.5),inset_0_-10px_18px_rgba(120,53,15,0.18)] [backface-visibility:hidden]"
                      style={{ transform: 'rotateY(180deg) translateZ(3px)' }}
                    >
                      <span className="absolute inset-2 rounded-full border border-amber-800/20" />
                      <span className="absolute inset-4 rounded-full border border-white/35" />
                      <span>B</span>
                    </div>
                  </motion.div>
                </div>

                {tossWinner && (
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-lg font-semibold text-white">{tossWinner} won the toss</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleDecision('bat')}
                        disabled={saving}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition-all duration-200 hover:bg-emerald-400/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Bat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision('bowl')}
                        disabled={saving}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-100 transition-all duration-200 hover:bg-sky-400/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Bowl
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="mt-6 border-t border-white/8 pt-5">
                  <button
                    type="button"
                    onClick={handleSkipToss}
                    disabled={!canSetToss || saving}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/[0.08] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Starting...' : 'Skip Toss - Quick Start'}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-500">Quick Start makes {teamAName} bat first.</p>
                </div>
              </section>

              <div className="mt-5 flex justify-center">
                <Link
                  to="/"
                  className="text-sm font-semibold text-orange-200/85 transition hover:text-orange-100"
                >
                  Create another match
                </Link>
              </div>
            </>
          )}

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Toss;
