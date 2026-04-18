import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ScoreBoard from '../components/ScoreBoard.jsx';
import Controls from '../components/Controls.jsx';
import useSocket from '../hooks/useSocket.js';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import Footer from '../components/Footer.jsx';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;

function Match() {
  const { code: matchCode } = useParams();
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [ownerToken, setOwnerToken] = useState('');
  const isMatchOver = match?.isCompleted === true;
  const isOwner = ownerToken.length > 0;
  const shareLink = matchCode ? `${window.location.origin}/match/${matchCode}` : '';

  useSocket({ matchCode, setMatch, setNotifications });

  useEffect(() => {
    if (!matchCode) {
      setOwnerToken('');
      return;
    }

    setOwnerToken(window.localStorage.getItem(getOwnerTokenStorageKey(matchCode)) || '');
  }, [matchCode]);

  useEffect(() => {
    const loadMatch = async () => {
      if (!matchCode) {
        return;
      }

      setError('');

      try {
        const response = await fetch(`${API_BASE}/match/${matchCode}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch match');
          return;
        }

        setMatch(data);
      } catch (err) {
        setError('Server error while fetching match.');
      }
    };

    loadMatch();
  }, [matchCode]);

  const handleScoreAction = async (action, runs = 0) => {
    if (!matchCode) return;
    setError('');
    setLoadingAction(true);

    try {
      const response = await fetch(`${API_BASE}/api/match/${matchCode}/${action}`, {
        method: 'POST',
        headers: {
          ...(action === 'run' ? { 'Content-Type': 'application/json' } : {}),
          ...(ownerToken ? { 'x-owner-token': ownerToken } : {}),
        },
        body: action === 'run' ? JSON.stringify({ runs }) : null,
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && matchCode) {
          window.localStorage.removeItem(getOwnerTokenStorageKey(matchCode));
          setOwnerToken('');
        }
        setError(data.error || 'Unable to update score');
        return;
      }
      setMatch(data);
    } catch (err) {
      setError('Server error while updating score.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRun = async (runs) => {
    await handleScoreAction('run', runs);
  };

  const handleWicket = async () => {
    console.log('WICKET CLICK');
    await handleScoreAction('wicket');
  };

  const handleUndo = async () => {
    console.log('UNDO CLICK');
    await handleScoreAction('undo');
  };

  return (
    <div className="min-h-screen px-4 py-5 text-slate-100 sm:px-5 sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-orange-300/10 bg-slate-900/70 p-4 shadow-[0_35px_120px_rgba(2,6,23,0.65)] backdrop-blur-2xl sm:p-6 md:p-8">
          <header className="sticky top-4 z-10 mb-6 rounded-[1.75rem] border border-orange-300/10 bg-slate-950/55 px-5 py-5 shadow-[0_12px_40px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-orange-200/65">Live Match Room</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">GullyCric</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Share this match link and keep scoring live from anywhere.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)] active:scale-95"
                >
                  New Match
                </Link>
              </div>
            </div>
          </header>

          {!isOnline && (
            <div className="mb-6">
              <OfflineNotice />
            </div>
          )}

          {error && (
            <section className="rounded-[1.75rem] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 shadow-[0_18px_50px_rgba(244,63,94,0.14)] animate-rise-in">
              {error}
            </section>
          )}

          {!error && !match && (
            <section className="rounded-[1.75rem] border border-orange-300/10 bg-slate-950/75 p-10 text-slate-300 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-300/20 border-t-orange-400" />
                <p className="text-center text-sm uppercase tracking-[0.26em] text-slate-400">Loading match...</p>
              </div>
            </section>
          )}

          {match && (
            <>
              <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="rounded-[1.75rem] border border-orange-300/10 bg-slate-950/65 p-5 text-slate-300 shadow-[0_20px_55px_rgba(2,6,23,0.35)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Share Link</p>
                  <p className="mt-2 break-all font-medium text-slate-100">{shareLink}</p>
                </div>
                {!isOwner && (
                  <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 p-5 text-orange-100 shadow-[0_20px_55px_rgba(249,115,22,0.08)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-orange-200/80">Viewer Access</p>
                    <p className="mt-2 font-semibold">View Only Mode</p>
                  </div>
                )}
              </div>

              <section className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
                <div className="rounded-[1.75rem] border border-orange-300/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6">
                  <ScoreBoard match={match} />
                  <Controls
                    disabled={isMatchOver}
                    isOwner={isOwner}
                    loadingAction={loadingAction}
                    onRun={handleRun}
                    onUndo={handleUndo}
                    onWicket={handleWicket}
                  />

                  {!isOwner && (
                    <p className="mt-4 rounded-[1.5rem] border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-100 shadow-[0_16px_40px_rgba(249,115,22,0.08)] animate-rise-in">
                      View Only Mode. Only the match creator can control scoring.
                    </p>
                  )}

                  {isOwner && isMatchOver && (
                    <div className="mt-4 rounded-[1.5rem] border border-orange-300/25 bg-orange-400/10 px-4 py-4 text-sm text-orange-50 shadow-[0_16px_40px_rgba(249,115,22,0.08)] animate-rise-in">
                      <p className="font-semibold uppercase tracking-[0.22em] text-orange-200/85">Match Ended</p>
                      The match is complete. Undo the last ball if you need to correct the result.
                    </div>
                  )}
                </div>

                <div className="rounded-[1.75rem] border border-orange-300/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6">
                  <h3 className="text-xl font-semibold text-white">Match details</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Overs</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.currentOver}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Innings</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.innings}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Target</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.target || '-'}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status</p>
                      <p className="mt-2 text-lg font-semibold text-white">{isMatchOver ? 'Completed' : 'In progress'}</p>
                    </div>
                  </div>

                  {match.result && (
                    <div className="mt-5 rounded-[1.5rem] border border-orange-300/20 bg-orange-400/10 px-4 py-4 text-sm text-orange-50 shadow-[0_16px_36px_rgba(249,115,22,0.08)]">
                      {match.result}
                    </div>
                  )}

                  <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/75 px-4 py-4 text-sm text-slate-400">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Created</p>
                    <p className="mt-2 text-slate-200">{new Date(match.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </section>

              {notifications.length > 0 && (
                <section className="mt-8 rounded-[1.75rem] border border-orange-300/10 bg-slate-950/75 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)] backdrop-blur">
                  <h3 className="text-lg font-semibold">Real-time updates</h3>
                  <ul className="mt-4 space-y-2 text-slate-300">
                    {notifications.map((note, index) => (
                      <li
                        key={index}
                        className="rounded-[1.25rem] border border-white/6 bg-slate-900/85 px-4 py-3 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Match;
