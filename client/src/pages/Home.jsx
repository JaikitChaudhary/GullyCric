import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import MatchSetup from '../components/MatchSetup.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';
import { getOrCreateDeviceId } from '../utils/deviceId.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;

const GULLY_TEAM_NAMES = [
  'Fire Warriors', 'Storm Riders', 'Thunderbolts', 'Ice Breakers', 'Shadow Hawks',
  'Blaze Kings', 'Night Wolves', 'Crimson Tigers', 'Golden Eagles', 'Steel Panthers',
  'Phantom Raiders', 'Blood Lions', 'Silver Foxes', 'Dark Knights', 'Flame Dragons',
  'Frost Giants', 'Wind Warriors', 'Earth Shakers', 'Lightning Lords', 'Mystic Bears',
  'Raging Bulls', 'Silent Snakes', 'Furious Falcons', 'Iron Wolves', 'Crimson Sharks',
  'Blazing Suns', 'Midnight Owls', 'Thunder Eagles', 'Storm Wolves', 'Fire Hawks'
];

function getRandomTeamNames() {
  // Check if user has previously used custom team names
  const savedTeamA = window.localStorage.getItem('gullycric:lastTeamA');
  const savedTeamB = window.localStorage.getItem('gullycric:lastTeamB');

  if (savedTeamA && savedTeamB && savedTeamA !== savedTeamB) {
    return { teamA: savedTeamA, teamB: savedTeamB };
  }

  // Generate random names
  const shuffled = [...GULLY_TEAM_NAMES].sort(() => Math.random() - 0.5);
  return {
    teamA: shuffled[0],
    teamB: shuffled[1]
  };
}

function Home() {
  const navigate = useNavigate();
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();
  const [showForm, setShowForm] = useState(false);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [overs, setOvers] = useState(20);
  const [error, setError] = useState('');
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [matchHistory, setMatchHistory] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const fetchHistory = async (currentDeviceId) => {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await fetch(`${API_BASE}/matches?deviceId=${encodeURIComponent(currentDeviceId)}`);
      const data = await response.json();

      if (!response.ok) {
        setHistoryError(data.error || 'Unable to fetch match history');
        return;
      }

      setMatchHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setHistoryError('Server error while fetching match history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchRecentTournaments = async (currentDeviceId) => {
    try {
      const response = await fetch(`${API_BASE}/tournaments?createdBy=${encodeURIComponent(currentDeviceId)}`);
      const data = await response.json();

      if (response.ok) {
        setRecentTournaments(Array.isArray(data) ? data.slice(0, 3) : []);
      }
    } catch (err) {
      setRecentTournaments([]);
    }
  };

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    fetchHistory(deviceId);
    fetchRecentTournaments(deviceId);
  }, [deviceId]);

  const createMatch = async ({ teamAName: nextTeamAName, teamBName: nextTeamBName, overs: nextOvers }) => {
    setError('');

    if (!nextTeamAName.trim() || !nextTeamBName.trim() || nextOvers <= 0) {
      setError('Please enter both team names and valid overs.');
      return;
    }

    setCreatingMatch(true);

    try {
      const activeDeviceId = deviceId || getOrCreateDeviceId();
      if (!deviceId) {
        setDeviceId(activeDeviceId);
      }

      const normalizedTeamAName = nextTeamAName.trim();
      const normalizedTeamBName = nextTeamBName.trim();
      const response = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${normalizedTeamAName} vs ${normalizedTeamBName}`,
          teamAName: normalizedTeamAName,
          teamBName: normalizedTeamBName,
          overs: nextOvers,
          deviceId: activeDeviceId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to create match');
        return;
      }

      window.localStorage.setItem(getOwnerTokenStorageKey(data.matchCode), data.ownerToken);
      // Save team names for future quick starts
      window.localStorage.setItem('gullycric:lastTeamA', normalizedTeamAName);
      window.localStorage.setItem('gullycric:lastTeamB', normalizedTeamBName);
      navigate(`/match/${data.matchCode}/toss`);
    } catch (err) {
      setError('Server error while creating match.');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createMatch({ teamAName, teamBName, overs });
  };

  const handleQuickStart = async () => {
    const { teamA, teamB } = getRandomTeamNames();
    await createMatch({
      teamAName: teamA,
      teamBName: teamB,
      overs: 5,
    });
  };

  const promptDeleteMatch = (match) => {
    setDeleteTarget(match);
  };

  const cancelDeleteMatch = () => {
    setDeleteTarget(null);
  };

  const handleDeleteMatch = async (matchCode) => {
    if (!deviceId) {
      return;
    }

    const previousHistory = matchHistory;
    setMatchHistory((current) => current.filter((item) => item.matchCode !== matchCode));
    setDeleteTarget(null);

    try {
      const response = await fetch(`${API_BASE}/match/${matchCode}?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        setHistoryError(data.error || 'Unable to delete match');
        setMatchHistory(previousHistory);
      }
    } catch (err) {
      setHistoryError('Server error while deleting match.');
      setMatchHistory(previousHistory);
    }
  };

  return (
    <div className="theme-text min-h-screen p-3">
      <div className="mx-auto min-h-screen max-w-5xl">
        <div className="w-full">
          <header className="theme-surface sticky top-3 z-10 mb-4 rounded-[1.5rem] border px-4 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <BrandLogo
                  alt="GullyCric logo"
                  priority
                  heightClassName="h-10 sm:h-11"
                  className="drop-shadow-[0_0_22px_rgba(249,115,22,0.18)]"
                />
                <p className="text-sm uppercase tracking-[0.28em] text-orange-200/75">Real-time Gully Cricket</p>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">Fast scoring for matches and tournaments.</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
              </div>
            </div>
          </header>

          {!isOnline && (
            <div className="mb-6">
              <OfflineNotice />
            </div>
          )}

          <section className="theme-surface rounded-[1.5rem] border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Quick Actions</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleQuickStart}
              disabled={creatingMatch}
              className="inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-gradient-to-r from-orange-500 to-amber-300 px-2 py-3 text-xs font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg">⚡</span>
              {creatingMatch ? 'Creating' : 'Quick Match'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="theme-secondary-button inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1.25rem] border px-2 py-3 text-xs font-semibold transition-all duration-200 active:scale-95"
            >
              <span className="text-lg">🏏</span>
              {showForm ? 'Hide Setup' : 'Create Match'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/tournaments')}
              className="theme-secondary-button inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1.25rem] border px-2 py-3 text-xs font-semibold transition-all duration-200 active:scale-95"
            >
              <span className="text-lg">🏆</span>
              Tournament
            </button>
            </div>
          </section>

          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}

          {showForm ? (
            <MatchSetup
              teamAName={teamAName}
              teamBName={teamBName}
              overs={overs}
              error={error}
              onTeamANameChange={setTeamAName}
              onTeamBNameChange={setTeamBName}
              onOversChange={setOvers}
              onSubmit={handleSubmit}
              submitting={creatingMatch}
            />
          ) : (
            <>
            <section className="theme-surface mt-4 rounded-[1.5rem] border p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Tournaments</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Recent Tournaments</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tournaments/create')}
                  className="theme-secondary-button rounded-full border px-3 py-2 text-xs font-semibold"
                >
                  + New
                </button>
              </div>
              {recentTournaments.length === 0 ? (
                <p className="mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                  No tournaments yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-2">
                  {recentTournaments.map((tournament) => (
                    <button
                      key={tournament.id}
                      type="button"
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      className="theme-card flex items-center gap-3 rounded-[1.25rem] border p-3 text-left"
                    >
                      {tournament.logo ? (
                        <img src={tournament.logo} alt="" className="h-10 w-10 rounded-[0.85rem] object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-orange-400/10">🏆</span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-white">{tournament.name}</span>
                        <span className="text-xs text-slate-400">{tournament.overs} overs</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section className="mt-4 grid gap-3 md:grid-cols-3">
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-orange-300/70">Live</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Fast Match Creation</h2>
                <p className="mt-3 text-sm leading-6">Create a fresh gully cricket match in seconds and jump straight into scoring.</p>
              </Card>
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-orange-300/70">Share</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Clean Match Links</h2>
                <p className="mt-3 text-sm leading-6">Every match gets a friendly shareable code so the whole group can follow along.</p>
              </Card>
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-orange-300/70">Control</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Owner-Based Scoring</h2>
                <p className="mt-3 text-sm leading-6">Only the creator can update the live score while everyone else stays in view-only mode.</p>
              </Card>
              <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center md:col-span-3">
                <p>Create a match to start scoring and get a shareable link.</p>
              </div>
            </section>
            </>
          )}
          <section className="theme-surface relative mt-4 rounded-[1.5rem] border p-4">
            {deleteTarget && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-4 py-5 backdrop-blur-sm rounded-[1.75rem]">
                <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-900/95 p-6 text-left shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
                  <p className="text-xs uppercase tracking-[0.28em] text-orange-300/80">Confirm delete</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">Delete this match?</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Are you sure you want to remove <span className="font-semibold text-white">{deleteTarget.teamAName} vs {deleteTarget.teamBName}</span> from your history?
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelDeleteMatch}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/[0.08] active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(deleteTarget.matchCode)}
                      className="inline-flex items-center justify-center rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-400 active:scale-95"
                    >
                      Delete match
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300/70">History</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Match History</h2>
              </div>
              <p className="text-sm text-slate-400">Last 20 matches on this device</p>
            </div>

            {historyLoading && (
              <p className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading match history...
              </p>
            )}

            {!historyLoading && historyError && (
              <p className="mt-5 rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {historyError}
              </p>
            )}

            {!historyLoading && !historyError && matchHistory.length === 0 && (
              <p className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                No matches created from this device yet.
              </p>
            )}

            {!historyLoading && !historyError && matchHistory.length > 0 && (
              <div className="mt-5 grid gap-3">
                {matchHistory.map((historyMatch) => (
                  <article
                    key={historyMatch.matchCode}
                    className="flex flex-col gap-3 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {historyMatch.teamAName} vs {historyMatch.teamBName}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {new Date(historyMatch.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/match/${historyMatch.matchCode}`)}
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/[0.08] active:scale-95"
                      >
                        View Match
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteMatch({
                          matchCode: historyMatch.matchCode,
                          teamAName: historyMatch.teamAName,
                          teamBName: historyMatch.teamBName,
                        })}
                        className="inline-flex items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-sm font-semibold text-rose-200 transition-all duration-200 hover:bg-rose-400/10 hover:scale-105 active:scale-95"
                        aria-label="Delete match"
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Home;
