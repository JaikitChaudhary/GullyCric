import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ScoreBoard from '../components/ScoreBoard.jsx';
import ActionBar from '../components/ActionBar.jsx';
import useSocket from '../hooks/useSocket.js';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import Footer from '../components/Footer.jsx';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';
import StickyScoreBar from '../components/StickyScoreBar.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import BallHistory from '../components/BallHistory.jsx';
import ScoringEventOverlay from '../components/ScoringEventOverlay.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { applyLocalScoreAction } from '../utils/localScoring.js';
import {
  countPendingScoringEvents,
  createScoringEventId,
  enqueueScoringEvent,
  getQueuedScoringEvents,
  markScoringEventSynced,
} from '../utils/scoringQueue.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;
const getMatchSnapshotStorageKey = (matchCode) => `gullycric:matchSnapshot:${matchCode}`;

const ACTION_TYPE_BY_ACTION = {
  run: 'RUN',
  wicket: 'WICKET',
  wide: 'WIDE',
  undo: 'UNDO',
};

function getMatchStatus(match) {
  if (!match) {
    return 'Match loading';
  }

  if (match.result) {
    return match.result;
  }

  if (match.innings === 2 && match.target) {
    const runsNeeded = Math.max(match.target - match.totalRuns, 0);
    const ballsLeft = Math.max((match.ballsLimit || 0) - (match.balls || 0), 0);
    const battingTeam = match.bowlingTeam || match.teamBName || 'Batting side';

    return runsNeeded === 0
      ? 'Target reached'
      : `${battingTeam} need ${runsNeeded} run${runsNeeded === 1 ? '' : 's'} in ${ballsLeft} ball${ballsLeft === 1 ? '' : 's'}`;
  }

  return `${match.battingTeam || match.teamAName || match.name || 'Live match'} in progress`;
}

function getTeamsByInnings(match) {
  const firstInningsBattingTeam = match?.battingTeam || match?.teamAName || 'Team A';
  const firstInningsBowlingTeam = match?.bowlingTeam || match?.teamBName || 'Team B';

  if (match?.innings === 2) {
    return {
      battingTeam: firstInningsBowlingTeam,
      bowlingTeam: firstInningsBattingTeam,
    };
  }

  return {
    battingTeam: firstInningsBattingTeam,
    bowlingTeam: firstInningsBowlingTeam,
  };
}

function hasScoringStarted(match) {
  return Boolean(
    match && (
      match.totalRuns > 0 ||
      match.wickets > 0 ||
      match.balls > 0 ||
      match.innings > 1 ||
      (Array.isArray(match.history) && match.history.length > 0)
    )
  );
}

function getCurrentOverBalls(match) {
  const history = Array.isArray(match?.history) ? match.history : [];

  if (history.length === 0) {
    return [];
  }

  let legalBallsInCurrentOver = 0;
  let currentOverEvents = [];

  history.forEach((entry) => {
    const isBall = typeof entry?.isBall === 'boolean'
      ? entry.isBall
      : entry?.type === 'run' || entry?.type === 'wicket';

    if (legalBallsInCurrentOver === 6) {
      currentOverEvents = [];
      legalBallsInCurrentOver = 0;
    }

    currentOverEvents.push(entry);

    if (isBall) {
      legalBallsInCurrentOver += 1;
    }
  });

  return currentOverEvents.map((entry) => {
    if (entry?.type === 'wicket') {
      return 'W';
    }

    if (entry?.type === 'wide' || entry?.type === 'WD') {
      return 'WD';
    }

    return String(entry?.runs ?? entry?.value ?? 0);
  });
}

function applyPendingEventsToMatch(serverMatch, pendingEvents) {
  return pendingEvents.reduce((nextMatch, event) => {
    try {
      return applyLocalScoreAction(nextMatch, event.action, event.payload);
    } catch (error) {
      return nextMatch;
    }
  }, serverMatch);
}

function Match() {
  const { code: matchCode } = useParams();
  const navigate = useNavigate();
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const [ownerToken, setOwnerToken] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [scoringEvent, setScoringEvent] = useState(null);
  const [scoringEventKey, setScoringEventKey] = useState(0);
  const copyFeedbackTimerRef = useRef(null);
  const isMatchOver = match?.isCompleted === true;
  const isOwner = ownerToken.length > 0;
  const [localUndoCount, setLocalUndoCount] = useState(0);
  const syncInProgressRef = useRef(false);
  const lastServerMatchRef = useRef(null);
  const pendingUpdatesRef = useRef(0);
  const currentMatchRef = useRef(null);
  const lastEventTimestampRef = useRef(0);
  const serverUndoCount = Number(match?.undoCount) || 0;
  const undoCount = Math.max(serverUndoCount, localUndoCount);
  const hasUndoableAction = Boolean(
    match && (
      (Array.isArray(match.history) && match.history.length > 0) ||
      (match.innings === 2 && match.previousInningsState)
    )
  );
  const isUndoDisabled = undoCount >= 2 || !hasUndoableAction;
  const shareLink = matchCode ? `${window.location.origin}/match/${matchCode}` : '';
  const teams = match ? getTeamsByInnings(match) : null;
  const stickyBarData = match
    ? {
        teamA: teams?.battingTeam,
        teamB: teams?.bowlingTeam,
        score: `${match.totalRuns}/${match.wickets}`,
        overs: match.currentOver,
        status: getMatchStatus(match),
        overBalls: getCurrentOverBalls(match),
      }
    : null;

  const setMatchFromServer = useCallback((updatedMatch) => {
    lastServerMatchRef.current = updatedMatch;

    if (pendingUpdatesRef.current === 0) {
      currentMatchRef.current = updatedMatch;
      setMatch(updatedMatch);
    }
  }, []);

  useSocket({ matchCode, setMatch: setMatchFromServer, setNotifications });

  const refreshPendingUpdates = useCallback(async () => {
    if (!matchCode) {
      pendingUpdatesRef.current = 0;
      setPendingUpdates(0);
      return 0;
    }

    try {
      const nextPendingUpdates = await countPendingScoringEvents(matchCode);
      pendingUpdatesRef.current = nextPendingUpdates;
      setPendingUpdates(nextPendingUpdates);
      return nextPendingUpdates;
    } catch (err) {
      return 0;
    }
  }, [matchCode]);

  const submitScoringEvent = useCallback(async (event) => {
    const response = await fetch(`${API_BASE}/api/match/${matchCode}/${event.action}`, {
      method: 'POST',
      headers: {
        ...(event.action === 'run' ? { 'Content-Type': 'application/json' } : {}),
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {}),
        'x-scoring-event-id': event.id,
      },
      body: event.action === 'run' ? JSON.stringify(event.payload || {}) : null,
    });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403 && matchCode) {
        window.localStorage.removeItem(getOwnerTokenStorageKey(matchCode));
        setOwnerToken('');
      }

      throw new Error(data.error || 'Unable to update score');
    }

    return data;
  }, [matchCode, ownerToken]);

  const syncPendingEvents = useCallback(async () => {
    if (!matchCode || !ownerToken || !navigator.onLine || syncInProgressRef.current) {
      return;
    }

    syncInProgressRef.current = true;

    try {
      let latestSyncedMatch = null;
      let shouldContinue = true;

      while (shouldContinue && navigator.onLine) {
        const pendingEvents = await getQueuedScoringEvents(matchCode);
        pendingUpdatesRef.current = pendingEvents.length;
        setPendingUpdates(pendingEvents.length);

        if (pendingEvents.length === 0) {
          break;
        }

        for (const event of pendingEvents) {
          try {
            latestSyncedMatch = await submitScoringEvent(event);
            await markScoringEventSynced(event);
            await refreshPendingUpdates();
          } catch (err) {
            if (navigator.onLine) {
              setError(err.message || 'Pending scoring updates will retry automatically.');
            }
            shouldContinue = false;
            break;
          }
        }
      }

      const remainingUpdates = await refreshPendingUpdates();
      if (remainingUpdates === 0 && latestSyncedMatch) {
        currentMatchRef.current = latestSyncedMatch;
        setMatch(latestSyncedMatch);
      } else if (remainingUpdates === 0 && lastServerMatchRef.current) {
        currentMatchRef.current = lastServerMatchRef.current;
        setMatch(lastServerMatchRef.current);
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [matchCode, ownerToken, refreshPendingUpdates, submitScoringEvent]);

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

        lastServerMatchRef.current = data;
        window.localStorage.setItem(getMatchSnapshotStorageKey(matchCode), JSON.stringify(data));

        const pendingEvents = await getQueuedScoringEvents(matchCode);
        pendingUpdatesRef.current = pendingEvents.length;
        setPendingUpdates(pendingEvents.length);
        const localMatch = applyPendingEventsToMatch(data, pendingEvents);
        currentMatchRef.current = localMatch;
        setMatch(localMatch);
      } catch (err) {
        const pendingEvents = await getQueuedScoringEvents(matchCode);
        const cachedMatch = window.localStorage.getItem(getMatchSnapshotStorageKey(matchCode));
        pendingUpdatesRef.current = pendingEvents.length;
        setPendingUpdates(pendingEvents.length);

        if (cachedMatch) {
          try {
            const parsedCachedMatch = JSON.parse(cachedMatch);
            const localMatch = applyPendingEventsToMatch(parsedCachedMatch, pendingEvents);
            currentMatchRef.current = localMatch;
            setMatch(localMatch);
            return;
          } catch (parseError) {
            window.localStorage.removeItem(getMatchSnapshotStorageKey(matchCode));
          }
        }

        if (pendingEvents.length === 0) {
          setError('Server error while fetching match.');
        }
      }
    };

    loadMatch();
  }, [matchCode]);

  useEffect(() => {
    refreshPendingUpdates();
  }, [refreshPendingUpdates]);

  useEffect(() => {
    pendingUpdatesRef.current = pendingUpdates;
  }, [pendingUpdates]);

  useEffect(() => {
    if (isOnline) {
      syncPendingEvents();
    }
  }, [isOnline, syncPendingEvents]);

  useEffect(() => {
    if (!matchCode || !match) {
      return;
    }

    currentMatchRef.current = match;

    if (pendingUpdatesRef.current === 0) {
      window.localStorage.setItem(getMatchSnapshotStorageKey(matchCode), JSON.stringify(match));
    }
  }, [match, matchCode]);

  useEffect(() => {
    if (!match || !matchCode || !ownerToken) {
      return;
    }

    if (!match.battingTeam && !match.bowlingTeam && !hasScoringStarted(match)) {
      navigate(`/match/${matchCode}/toss`, { replace: true });
    }
  }, [match, matchCode, navigate, ownerToken]);

  useEffect(() => () => {
    if (copyFeedbackTimerRef.current) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
  }, []);

  const showCopyFeedback = (message) => {
    setCopyFeedback(message);

    if (copyFeedbackTimerRef.current) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }

    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyFeedback('');
      copyFeedbackTimerRef.current = null;
    }, 2200);
  };

  const handleShareOnWhatsApp = () => {
    if (!match || !shareLink) {
      return;
    }

    const teamAName = match.teamAName || 'Team A';
    const teamBName = match.teamBName || 'Team B';
    const score = `${match.totalRuns}/${match.wickets}`;
    const overs = match.currentOver || '0.0';
    const message = [
      '🏏 Live Gully Cricket Score',
      '',
      `${teamAName} vs ${teamBName}`,
      `Score: ${score} (${overs})`,
      '',
      'Watch live here 👇',
      shareLink,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    if (!shareLink) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      showCopyFeedback('Link copied');
    } catch (err) {
      showCopyFeedback('Unable to copy link');
    }
  };

  const handleScoreAction = async (action, runs = 0) => {
    if (!matchCode) return;
    if (action === 'undo' && isUndoDisabled) {
      setError('Only the last 2 balls can be undone');
      return;
    }

    setError('');
    setLoadingAction(false);

    const payload = action === 'run' ? { runs } : {};
    const timestamp = Math.max(Date.now(), lastEventTimestampRef.current + 1);
    lastEventTimestampRef.current = timestamp;
    const event = {
      id: createScoringEventId(),
      matchId: matchCode,
      action,
      actionType: ACTION_TYPE_BY_ACTION[action] || action.toUpperCase(),
      payload,
      timestamp,
      synced: false,
    };

    try {
      const optimisticMatch = applyLocalScoreAction(currentMatchRef.current || match, action, payload);
      await enqueueScoringEvent(event);
      currentMatchRef.current = optimisticMatch;
      setMatch(optimisticMatch);
      await refreshPendingUpdates();

      if (action === 'undo') {
        setLocalUndoCount((currentUndoCount) => Math.min(currentUndoCount + 1, 2));
      } else {
        setLocalUndoCount(0);
      }

      syncPendingEvents();
    } catch (err) {
      setError(err.message || 'Unable to update score');
    }
  };

  const triggerScoringEvent = (event) => {
    setScoringEvent(event);
    setScoringEventKey((prev) => prev + 1);
  };

  const handleRun = async (runs) => {
    if (runs === 4) triggerScoringEvent('FOUR');
    else if (runs === 6) triggerScoringEvent('SIX');
    await handleScoreAction('run', runs);
  };

  const handleWicket = async () => {
    triggerScoringEvent('WICKET');
    await handleScoreAction('wicket');
  };

  const handleWide = async () => {
    await handleScoreAction('wide');
  };

  const handleUndo = async () => {
    await handleScoreAction('undo');
  };

  return (
    <div className="theme-text min-h-screen px-4 pb-5 pt-14 sm:px-5 sm:pb-6 sm:pt-[4.25rem]">
      <ScoringEventOverlay eventType={scoringEvent} triggerKey={scoringEventKey} />
      {stickyBarData && (
        <StickyScoreBar
          {...stickyBarData}
          isLive={!isMatchOver}
          onClick={() => navigate(`/match/${matchCode}`)}
        />
      )}
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center mt-10">
        <div className="theme-surface-strong w-full rounded-[2rem] border p-4 backdrop-blur-2xl sm:p-6 md:p-8">
          <header className="theme-surface mb-6 rounded-[1.75rem] border px-5 py-5 backdrop-blur-xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <BrandLogo
                  alt="GullyCric logo"
                  priority
                  heightClassName="h-10 sm:h-11"
                  className="drop-shadow-[0_0_22px_rgba(249,115,22,0.18)]"
                />
                <p className="text-xs uppercase tracking-[0.36em] text-orange-200/65">Live Match Room</p>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Share this match link and keep scoring live from anywhere.
                </p>
              </div>
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                <ThemeToggle />
                <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)] active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Match</span>
                </Link>
              </div>
            </div>
          </header>

          {!isOnline && (
            <div className="mb-6">
              <OfflineNotice />
            </div>
          )}

          <div className="mb-6 flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 shadow-[0_12px_30px_rgba(2,6,23,0.25)]">
              <span>{isOnline ? '🟢 Online' : `🔴 Offline (${pendingUpdates} pending updates)`}</span>
              {isOnline && pendingUpdates > 0 && (
                <span className="text-amber-200">Syncing {pendingUpdates}</span>
              )}
            </div>
          </div>

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
              {!isOwner && (
                <div className="mb-6 rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 p-5 text-orange-100 shadow-[0_20px_55px_rgba(249,115,22,0.08)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.28em] text-orange-200/80">Viewer Access</p>
                  <p className="mt-2 font-semibold">View Only Mode</p>
                </div>
              )}

              <section className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
                <div className="theme-surface rounded-[1.75rem] border p-5 backdrop-blur-xl sm:p-6">
                  <ScoreBoard match={match} />
                  <ActionBar
                    disabled={isMatchOver}
                    isOwner={isOwner}
                    loadingAction={loadingAction}
                    onRun={handleRun}
                    onWide={handleWide}
                    onUndo={handleUndo}
                    onWicket={handleWicket}
                    undoDisabled={isUndoDisabled}
                  />
                  <div className="mt-5 rounded-[1.5rem] border border-orange-300/10 bg-slate-900/70 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Share Live Score</p>
                      <div className="flex flex-row gap-2 sm:gap-3 sm:items-center">
                        <button
                          type="button"
                          onClick={handleShareOnWhatsApp}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,197,94,0.22)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(34,197,94,0.3)] active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 20l1.4-5.2A8.4 8.4 0 1 1 21 11.5Z" />
                            <path d="M9.5 8.5c.3 3 2 4.8 5 6" />
                            <path d="m9.4 8.5.7-1.1" />
                            <path d="m14.5 14.5 1.2-.7" />
                          </svg>
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/[0.08] active:scale-95 sm:px-4 sm:py-3 sm:text-sm"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="8" y="8" width="12" height="12" rx="2" />
                            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                          </svg>
                          <span>Copy</span>
                        </button>
                        {copyFeedback && (
                          <span className="text-xs sm:text-sm font-medium text-emerald-200 whitespace-nowrap" role="status">
                            {copyFeedback}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

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

                <div className="theme-surface rounded-[1.75rem] border p-5 backdrop-blur-xl sm:p-6">
                  <h3 className="text-xl font-semibold text-white">Match details</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Teams</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.teamAName} vs {match.teamBName}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Batting First</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.battingTeam || match.teamAName || '-'}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Bowling First</p>
                      <p className="mt-2 text-lg font-semibold text-white">{match.bowlingTeam || match.teamBName || '-'}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Toss</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {match.tossWinner && match.decision
                          ? `${match.tossWinner} chose to ${match.decision}`
                          : 'Skipped'}
                      </p>
                    </div>
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

              <section className="mt-6">
                <BallHistory history={match.history} />
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
