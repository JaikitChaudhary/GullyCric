import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function TeamDetails() {
  const { id, teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/tournaments/${id}/teams/${teamId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Unable to fetch team');
          return;
        }

        setTeam(data);
      } catch (err) {
        setError('Server error while fetching team.');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [id, teamId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/teams/${teamId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to delete team');
        setShowDeleteConfirm(false);
        return;
      }

      navigate(`/tournaments/${id}/teams`);
    } catch (err) {
      setError('Server error while deleting team.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong relative min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-slate-950/80 px-4 py-5 backdrop-blur-sm">
              <div className="w-full rounded-[1.75rem] border border-white/10 bg-slate-900/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300/80">Confirm delete</p>
                <h2 className="mt-4 text-xl font-semibold text-white">Delete this team?</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This removes <span className="font-semibold text-white">{team?.teamName}</span> from the tournament.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="theme-secondary-button inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center justify-center rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Team Details</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Link
              to={`/tournaments/${id}/teams`}
              className="theme-secondary-button inline-flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              Back to Teams
            </Link>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading team...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && team && (
              <>
                <Card className="p-5 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Team</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">{team.teamName}</h1>
                  <p className="mt-3 text-sm text-slate-400">
                    Captain: <span className="font-semibold text-slate-200">{team.captain?.name || 'Not set'}</span>
                  </p>
                </Card>

                <section className="grid gap-3">
                  {team.players.map((player) => (
                    <article
                      key={player.id}
                      className="theme-card rounded-[1.5rem] border p-4"
                    >
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{player.mobile}</p>
                      {player.id === team.captainPlayerId && (
                        <p className="mt-3 inline-flex rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-100">
                          Captain
                        </p>
                      )}
                    </article>
                  ))}
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={`/tournaments/${id}/teams/${teamId}/edit`}
                    className="theme-secondary-button inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
                  >
                    Edit Team
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm font-semibold text-rose-200 transition-all duration-200 active:scale-95"
                  >
                    Delete Team
                  </button>
                </div>
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default TeamDetails;
