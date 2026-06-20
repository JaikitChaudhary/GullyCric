import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { getOrCreateDeviceId } from '../utils/deviceId.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function MatchHub() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setError('');

      try {
        const deviceId = getOrCreateDeviceId();
        const response = await fetch(`${API_BASE}/matches?deviceId=${encodeURIComponent(deviceId)}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch matches');
          return;
        }

        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Server error while fetching matches.');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Matches</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95"
            >
              Create Match
            </Link>

            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Match Room</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Recent Matches</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">Open a live match room without changing the scoring flow.</p>
            </Card>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading matches...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && matches.length === 0 && (
              <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                <p className="text-sm text-slate-300">No matches created from this device yet.</p>
              </div>
            )}

            {!loading && !error && matches.length > 0 && (
              <div className="grid gap-3">
                {matches.map((match) => (
                  <button
                    key={match.matchCode}
                    type="button"
                    onClick={() => navigate(`/match/${match.matchCode}`)}
                    className="theme-card w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <p className="font-semibold text-white">{match.teamAName} vs {match.teamBName}</p>
                    <p className="mt-1 text-sm text-slate-400">{new Date(match.createdAt).toLocaleString()}</p>
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

export default MatchHub;
