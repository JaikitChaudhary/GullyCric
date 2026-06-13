import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function PlayerList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlayerPool = async () => {
      setLoading(true);
      setError('');

      try {
        const [tournamentResponse, playersResponse] = await Promise.all([
          fetch(`${API_BASE}/tournaments/${id}`),
          fetch(`${API_BASE}/tournaments/${id}/players`),
        ]);
        const tournamentData = await tournamentResponse.json();
        const playersData = await playersResponse.json();

        if (!tournamentResponse.ok) {
          setError(tournamentData.error || 'Unable to fetch tournament');
          return;
        }

        if (!playersResponse.ok) {
          setError(playersData.error || 'Unable to fetch players');
          return;
        }

        setTournament(tournamentData);
        setPlayers(Array.isArray(playersData) ? playersData : []);
      } catch (err) {
        setError('Server error while fetching players.');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerPool();
  }, [id]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return players;
    }

    return players.filter((player) =>
      player.name.toLowerCase().includes(normalizedSearch) ||
      player.mobile.toLowerCase().includes(normalizedSearch)
    );
  }, [players, search]);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong relative min-h-screen rounded-[2rem] border p-5 pb-24 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Player Pool</p>
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
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Players</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{tournament?.name || 'Tournament Players'}</h1>
              <p className="mt-2 text-sm text-slate-400">{players.length} players in pool</p>
            </Card>

            <label className="block">
              <span className="sr-only">Search Player</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="theme-input w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                placeholder="Search player"
              />
            </label>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading players...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && filteredPlayers.length === 0 && (
              <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                <p className="text-sm text-slate-300">
                  {players.length === 0 ? 'No players added yet.' : 'No players match your search.'}
                </p>
              </div>
            )}

            {!loading && !error && filteredPlayers.length > 0 && (
              <div className="grid gap-3">
                {filteredPlayers.map((player) => (
                  <article
                    key={player.id}
                    className="theme-card flex items-center justify-between gap-4 rounded-[1.5rem] border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{player.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{player.mobile}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/tournaments/${id}/players/${player.id}/edit`)}
                      className="theme-secondary-button inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95"
                    >
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            )}
          </main>

          <Link
            to={`/tournaments/${id}/players/add`}
            aria-label="Add Player"
            className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 text-3xl font-semibold leading-none text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.35)] transition-all duration-200 active:scale-95"
          >
            +
          </Link>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default PlayerList;
