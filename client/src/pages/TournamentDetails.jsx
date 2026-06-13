import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function formatDate(value) {
  if (!value) {
    return 'Date not set';
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTournament = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/tournaments/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch tournament');
          return;
        }

        setTournament(data);
      } catch (err) {
        setError('Server error while fetching tournament.');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [id]);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Tournament Details</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Link
              to="/tournaments"
              className="theme-secondary-button inline-flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              Back to Tournaments
            </Link>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading tournament...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && tournament && (
              <>
                <Card className="p-5 text-center">
                  {tournament.logo ? (
                    <img
                      src={tournament.logo}
                      alt={`${tournament.name} logo`}
                      className="mx-auto h-24 w-24 rounded-[1.75rem] border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 text-4xl font-black text-orange-100">
                      {tournament.name?.slice(0, 1).toUpperCase() || 'T'}
                    </div>
                  )}
                  <p className="mt-5 text-xs uppercase tracking-[0.24em] text-orange-300/70">Tournament</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">{tournament.name}</h1>
                </Card>

                <section className="grid gap-3">
                  <div className="theme-card rounded-[1.5rem] border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Start Date</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDate(tournament.startDate)}</p>
                  </div>
                  <div className="theme-card rounded-[1.5rem] border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Overs</p>
                    <p className="mt-2 text-lg font-semibold text-white">{tournament.overs} overs</p>
                  </div>
                  <div className="theme-card rounded-[1.5rem] border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Created</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDate(tournament.createdAt)}</p>
                  </div>
                </section>

                <Link
                  to={`/tournaments/${id}/players`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95"
                >
                  Player Pool
                </Link>
                <Link
                  to={`/tournaments/${id}/teams`}
                  className="theme-secondary-button inline-flex w-full items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
                >
                  Teams
                </Link>
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default TournamentDetails;
