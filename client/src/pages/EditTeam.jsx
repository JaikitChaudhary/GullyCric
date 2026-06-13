import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import TeamForm from '../components/TeamForm.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function EditTeam() {
  const { id, teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      setError('');

      try {
        const [teamResponse, playersResponse, teamsResponse] = await Promise.all([
          fetch(`${API_BASE}/tournaments/${id}/teams/${teamId}`),
          fetch(`${API_BASE}/tournaments/${id}/players`),
          fetch(`${API_BASE}/tournaments/${id}/teams`),
        ]);
        const teamData = await teamResponse.json();
        const playersData = await playersResponse.json();
        const teamsData = await teamsResponse.json();

        if (!teamResponse.ok) {
          setError(teamData.error || 'Unable to fetch team');
          return;
        }

        if (!playersResponse.ok) {
          setError(playersData.error || 'Unable to fetch players');
          return;
        }

        if (!teamsResponse.ok) {
          setError(teamsData.error || 'Unable to fetch teams');
          return;
        }

        setTeam(teamData);
        setPlayers(Array.isArray(playersData) ? playersData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        setError('Server error while loading team.');
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id, teamId]);

  const handleSubmit = async (teamPayload) => {
    setError('');

    if (!teamPayload.teamName.trim() || !teamPayload.captainPlayerId || teamPayload.playerIds.length === 0) {
      setError('Please enter team name, captain, and players.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamPayload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to update team');
        return;
      }

      navigate(`/tournaments/${id}/teams/${data.id}`);
    } catch (err) {
      setError('Server error while updating team.');
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
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Edit Team</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Link
              to={`/tournaments/${id}/teams/${teamId}`}
              className="theme-secondary-button inline-flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              Back to Team
            </Link>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading team...
              </p>
            )}

            {!loading && !team && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && team && (
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Team Management</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">Edit Team</h1>
                <div className="mt-5">
                  <TeamForm
                    players={players}
                    teams={teams}
                    currentTeamId={teamId}
                    initialTeamName={team.teamName}
                    initialCaptainPlayerId={team.captainPlayerId}
                    initialPlayerIds={team.playerIds}
                    submitting={submitting}
                    error={error}
                    submitLabel="Save Team"
                    onSubmit={handleSubmit}
                  />
                </div>
              </Card>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default EditTeam;
