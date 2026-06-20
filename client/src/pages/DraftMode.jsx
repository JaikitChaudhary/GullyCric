import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const socket = io(API_BASE, { transports: ['websocket'] });

function getPickedPlayerIds(draft) {
  return new Set([
    ...(draft?.teamAPlayerIds || []),
    ...(draft?.teamBPlayerIds || []),
  ]);
}

function DraftMode() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [draft, setDraft] = useState(null);
  const [captainAPlayerId, setCaptainAPlayerId] = useState('');
  const [captainBPlayerId, setCaptainBPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pickedPlayerIds = useMemo(() => getPickedPlayerIds(draft), [draft]);
  const availablePlayers = useMemo(
    () => players.filter((player) => !pickedPlayerIds.has(player.id)),
    [pickedPlayerIds, players]
  );
  const currentCaptain = draft?.currentTurn === 'A' ? draft?.captainA : draft?.captainB;

  useEffect(() => {
    const loadDraftMode = async () => {
      setLoading(true);
      setError('');

      try {
        const [tournamentResponse, playersResponse, draftResponse] = await Promise.all([
          fetch(`${API_BASE}/tournaments/${id}`),
          fetch(`${API_BASE}/tournaments/${id}/players`),
          fetch(`${API_BASE}/tournaments/${id}/draft`),
        ]);
        const tournamentData = await tournamentResponse.json();
        const playersData = await playersResponse.json();
        const draftData = await draftResponse.json();

        if (!tournamentResponse.ok) {
          setError(tournamentData.error || 'Unable to fetch tournament');
          return;
        }

        if (!playersResponse.ok) {
          setError(playersData.error || 'Unable to fetch players');
          return;
        }

        if (!draftResponse.ok) {
          setError(draftData.error || 'Unable to fetch draft');
          return;
        }

        setTournament(tournamentData);
        setPlayers(Array.isArray(playersData) ? playersData : []);
        setDraft(draftData.draft || null);
      } catch (err) {
        setError('Server error while loading draft mode.');
      } finally {
        setLoading(false);
      }
    };

    loadDraftMode();
  }, [id]);

  useEffect(() => {
    socket.emit('joinDraft', id);
    socket.on('draftUpdate', (updatedDraft) => {
      if (updatedDraft?.tournamentId === id) {
        setDraft(updatedDraft);
      }
    });

    return () => {
      socket.off('draftUpdate');
    };
  }, [id]);

  const startDraft = async (event) => {
    event.preventDefault();
    setError('');

    if (!captainAPlayerId || !captainBPlayerId || captainAPlayerId === captainBPlayerId) {
      setError('Select two different captains.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/draft/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captainAPlayerId, captainBPlayerId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to start draft');
        return;
      }

      setDraft(data);
    } catch (err) {
      setError('Server error while starting draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickPlayer = async (playerId) => {
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/draft/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to pick player');
        return;
      }

      setDraft(data);
    } catch (err) {
      setError('Server error while picking player.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraftStatus = async (nextAction) => {
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/draft/${nextAction}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Unable to ${nextAction} draft`);
        return;
      }

      setDraft(data);
    } catch (err) {
      setError(`Server error while trying to ${nextAction} draft.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Captain Draft</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Link
              to={`/tournaments/${id}`}
              className="theme-secondary-button inline-flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              Back to Tournament
            </Link>

            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Draft Mode</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{tournament?.name || 'Tournament'}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">Captains alternate turns until every available player is picked.</p>
            </Card>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading draft...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !draft && (
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Setup</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Select Captains</h2>

                <form className="mt-5 space-y-4" onSubmit={startDraft}>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200">Captain A</span>
                    <select
                      value={captainAPlayerId}
                      onChange={(event) => setCaptainAPlayerId(event.target.value)}
                      className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    >
                      <option value="">Select captain</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200">Captain B</span>
                    <select
                      value={captainBPlayerId}
                      onChange={(event) => setCaptainBPlayerId(event.target.value)}
                      className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    >
                      <option value="">Select captain</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting || players.length < 2}
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Starting...' : 'Start Draft'}
                  </button>
                </form>
              </Card>
            )}

            {!loading && draft && (
              <>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Current Turn</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {draft.status === 'completed'
                          ? 'Draft completed'
                          : draft.status === 'paused'
                            ? 'Draft paused'
                            : `${currentCaptain?.name || 'Captain'} picks next`}
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                      {draft.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {draft.status === 'paused' ? (
                      <button
                        type="button"
                        onClick={() => updateDraftStatus('resume')}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 active:scale-95 disabled:opacity-50"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateDraftStatus('pause')}
                        disabled={submitting || draft.status === 'completed'}
                        className="theme-secondary-button inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50"
                      >
                        Pause
                      </button>
                    )}
                    <Link
                      to={`/tournaments/${id}/teams`}
                      className="theme-secondary-button inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
                    >
                      Manual Teams
                    </Link>
                  </div>
                </Card>

                <section className="grid grid-cols-2 gap-3">
                  <div className="theme-card rounded-[1.5rem] border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Captain A</p>
                    <h3 className="mt-2 font-semibold text-white">{draft.captainA?.name}</h3>
                    <div className="mt-4 grid gap-2">
                      {draft.teamAPlayers.map((player) => (
                        <p key={player.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                          {player.name}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="theme-card rounded-[1.5rem] border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Captain B</p>
                    <h3 className="mt-2 font-semibold text-white">{draft.captainB?.name}</h3>
                    <div className="mt-4 grid gap-2">
                      {draft.teamBPlayers.map((player) => (
                        <p key={player.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                          {player.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Available Players</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{availablePlayers.length} remaining</h2>
                  </div>

                  {availablePlayers.length === 0 && (
                    <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                      <p className="text-sm text-slate-300">All players have been picked.</p>
                    </div>
                  )}

                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => pickPlayer(player.id)}
                      disabled={submitting || draft.status !== 'active'}
                      className="theme-card flex w-full items-center justify-between gap-4 rounded-[1.5rem] border p-4 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-white">{player.name}</span>
                        <span className="mt-1 block text-sm text-slate-400">{player.mobile}</span>
                      </span>
                      <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-100">
                        Pick
                      </span>
                    </button>
                  ))}
                </section>
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default DraftMode;
