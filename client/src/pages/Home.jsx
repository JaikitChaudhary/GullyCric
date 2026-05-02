import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import MatchSetup from '../components/MatchSetup.jsx';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;
const DEVICE_ID_STORAGE_KEY = 'gullycric:deviceId';

function getOrCreateDeviceId() {
  const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    const loadMatchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await fetch(`${API_BASE}/matches?deviceId=${encodeURIComponent(deviceId)}`);
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

    loadMatchHistory();
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
      navigate(`/match/${data.matchCode}`);
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
    await createMatch({
      teamAName: 'Team A',
      teamBName: 'Team B',
      overs: 5,
    });
  };

  return (
    <div className="min-h-screen p-4 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-orange-300/10 bg-slate-950/75 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl md:p-8">
          <header className="sticky top-4 z-10 mb-8 rounded-[1.75rem] border border-orange-300/10 bg-slate-950/50 px-5 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <BrandLogo
                  alt="GullyCric logo"
                  priority
                  heightClassName="h-10 sm:h-11"
                  className="drop-shadow-[0_0_22px_rgba(249,115,22,0.18)]"
                />
                <p className="text-sm uppercase tracking-[0.28em] text-orange-200/75">Real-time Gully Cricket</p>
                <p className="mt-2 max-w-2xl text-slate-300">Create a match, share the clean live link, and keep the score moving with a fast mobile-friendly scorer.</p>
              </div>
              <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
            </div>
          </header>

          {!isOnline && (
            <div className="mb-6">
              <OfflineNotice />
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={handleQuickStart}
              disabled={creatingMatch}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingMatch ? 'Creating...' : 'Quick 5 Over Match'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/[0.08] active:scale-95"
            >
              {showForm ? 'Hide Match Setup' : 'Create Match'}
            </button>
          </div>

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
            <section className="mt-8 grid gap-4 md:grid-cols-3">
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
              <div className="rounded-[1.75rem] border border-dashed border-orange-300/10 bg-slate-950/60 p-8 text-center text-slate-300 md:col-span-3">
                <p>Create a match to start scoring and get a shareable link.</p>
              </div>
            </section>
          )}
          <section className="mt-8 rounded-[1.75rem] border border-orange-300/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.32)]">
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
                    <button
                      type="button"
                      onClick={() => navigate(`/match/${historyMatch.matchCode}`)}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:scale-105 hover:bg-white/[0.08] active:scale-95"
                    >
                      View Match
                    </button>
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
