import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { getOrCreateDeviceId } from '../utils/deviceId.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function formatDate(value) {
  if (!value) {
    return 'Date not set';
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TournamentLogo({ logo, name }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-14 w-14 rounded-[1.25rem] border border-white/10 object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-orange-300/20 bg-orange-400/10 text-lg font-black text-orange-100">
      {name?.slice(0, 1).toUpperCase() || 'T'}
    </div>
  );
}

function TournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      setError('');

      try {
        const createdBy = getOrCreateDeviceId();
        const response = await fetch(`${API_BASE}/tournaments?createdBy=${encodeURIComponent(createdBy)}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch tournaments');
          return;
        }

        setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Server error while fetching tournaments.');
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Tournaments</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <div className="flex gap-3">
              <Link
                to="/"
                className="theme-secondary-button inline-flex flex-1 items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
              >
                Home
              </Link>
              <Link
                to="/tournaments/create"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95"
              >
                Create
              </Link>
            </div>

            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Tournament List</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Your Tournaments</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">Set up gully cricket tournaments without changing live match scoring.</p>
            </Card>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading tournaments...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && tournaments.length === 0 && (
              <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                <p className="text-sm text-slate-300">No tournaments created yet.</p>
              </div>
            )}

            {!loading && !error && tournaments.length > 0 && (
              <div className="grid gap-3">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    type="button"
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                    className="theme-card flex w-full items-center gap-4 rounded-[1.75rem] border p-4 text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <TournamentLogo logo={tournament.logo} name={tournament.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{tournament.name}</span>
                      <span className="mt-1 block text-sm text-slate-400">
                        {formatDate(tournament.startDate)} · {tournament.overs} overs
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default TournamentList;
