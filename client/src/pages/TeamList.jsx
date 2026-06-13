import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function TeamList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      setError('');

      try {
        const [tournamentResponse, teamsResponse] = await Promise.all([
          fetch(`${API_BASE}/tournaments/${id}`),
          fetch(`${API_BASE}/tournaments/${id}/teams`),
        ]);
        const tournamentData = await tournamentResponse.json();
        const teamsData = await teamsResponse.json();

        if (!tournamentResponse.ok) {
          setError(tournamentData.error || 'Unable to fetch tournament');
          return;
        }

        if (!teamsResponse.ok) {
          setError(teamsData.error || 'Unable to fetch teams');
          return;
        }

        setTournament(tournamentData);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        setError('Server error while fetching teams.');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [id]);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong relative min-h-screen rounded-[2rem] border p-5 pb-24 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Teams</p>
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
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Team Management</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{tournament?.name || 'Tournament Teams'}</h1>
              <p className="mt-2 text-sm text-slate-400">{teams.length} teams created</p>
            </Card>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading teams...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && teams.length === 0 && (
              <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                <p className="text-sm text-slate-300">No teams created yet.</p>
              </div>
            )}

            {!loading && !error && teams.length > 0 && (
              <div className="grid gap-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => navigate(`/tournaments/${id}/teams/${team.id}`)}
                    className="theme-card flex w-full items-center justify-between gap-4 rounded-[1.5rem] border p-4 text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-white">{team.teamName}</span>
                      <span className="mt-1 block text-sm text-slate-400">
                        {team.players.length} players · {team.captain?.name || 'Captain not set'}
                      </span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                      View
                    </span>
                  </button>
                ))}
              </div>
            )}
          </main>

          <Link
            to={`/tournaments/${id}/teams/create`}
            aria-label="Create Team"
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

export default TeamList;
