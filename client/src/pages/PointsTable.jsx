import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function PointsTable() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [rows, setRows] = useState([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const selectedTeamA = useMemo(
    () => teams.find((team) => team.id === teamAId),
    [teamAId, teams]
  );

  const selectedTeamB = useMemo(
    () => teams.find((team) => team.id === teamBId),
    [teamBId, teams]
  );

  const loadPointsTable = async () => {
    const response = await fetch(`${API_BASE}/tournaments/${id}/points-table`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to fetch points table');
    }

    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [tournamentResponse, teamsResponse, pointsResponse] = await Promise.all([
          fetch(`${API_BASE}/tournaments/${id}`),
          fetch(`${API_BASE}/tournaments/${id}/teams`),
          fetch(`${API_BASE}/tournaments/${id}/points-table`),
        ]);
        const tournamentData = await tournamentResponse.json();
        const teamsData = await teamsResponse.json();
        const pointsData = await pointsResponse.json();

        if (!tournamentResponse.ok) {
          setError(tournamentData.error || 'Unable to fetch tournament');
          return;
        }

        if (!teamsResponse.ok) {
          setError(teamsData.error || 'Unable to fetch teams');
          return;
        }

        if (!pointsResponse.ok) {
          setError(pointsData.error || 'Unable to fetch points table');
          return;
        }

        setTournament(tournamentData);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setRows(Array.isArray(pointsData) ? pointsData : []);
      } catch (err) {
        setError(err.message || 'Server error while fetching points table.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleRecordResult = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!teamAId || !teamBId || teamAId === teamBId || !result) {
      setFormError('Select two different teams and a result.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/tournament-matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamAId, teamBId, result }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Unable to record match result');
        return;
      }

      setTeamAId('');
      setTeamBId('');
      setResult('');
      await loadPointsTable();
    } catch (err) {
      setFormError('Server error while recording match result.');
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
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Points Table</p>
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
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Standings</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{tournament?.name || 'Tournament'}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">Win 2 points, tie 1 point, loss 0 points.</p>
            </Card>

            {loading && (
              <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Loading points table...
              </p>
            )}

            {!loading && error && (
              <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {!loading && !error && (
              <>
                <section className="grid gap-3">
                  {rows.length === 0 && (
                    <div className="theme-card rounded-[1.75rem] border border-dashed p-8 text-center">
                      <p className="text-sm text-slate-300">Create teams to start the points table.</p>
                    </div>
                  )}

                  {rows.map((row, index) => (
                    <article
                      key={row.teamId}
                      className="theme-card rounded-[1.5rem] border p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70">Rank {index + 1}</p>
                          <h2 className="mt-1 truncate text-lg font-semibold text-white">{row.teamName}</h2>
                        </div>
                        <div className="rounded-[1.25rem] border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-center">
                          <p className="text-2xl font-black text-orange-100">{row.points}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-orange-200/70">Pts</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-2 py-3">
                          <p className="text-lg font-semibold text-white">{row.played}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">Played</p>
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-2 py-3">
                          <p className="text-lg font-semibold text-white">{row.won}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">Won</p>
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-2 py-3">
                          <p className="text-lg font-semibold text-white">{row.lost}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">Lost</p>
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-2 py-3">
                          <p className="text-lg font-semibold text-white">{row.tied}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">Tied</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                <Card className="p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Completed Match</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Record Result</h2>

                  <form className="mt-5 space-y-4" onSubmit={handleRecordResult}>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-200">Team A</span>
                        <select
                          value={teamAId}
                          onChange={(event) => setTeamAId(event.target.value)}
                          className="theme-input mt-2 w-full rounded-[1.25rem] border px-3 py-3 outline-none focus:border-orange-300/60"
                        >
                          <option value="">Select</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.teamName}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-slate-200">Team B</span>
                        <select
                          value={teamBId}
                          onChange={(event) => setTeamBId(event.target.value)}
                          className="theme-input mt-2 w-full rounded-[1.25rem] border px-3 py-3 outline-none focus:border-orange-300/60"
                        >
                          <option value="">Select</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.teamName}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-200">Result</span>
                      <select
                        value={result}
                        onChange={(event) => setResult(event.target.value)}
                        className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                      >
                        <option value="">Select result</option>
                        {selectedTeamA && <option value="teamA">{selectedTeamA.teamName} won</option>}
                        {selectedTeamB && <option value="teamB">{selectedTeamB.teamName} won</option>}
                        <option value="tie">Tie</option>
                      </select>
                    </label>

                    {formError && (
                      <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || teams.length < 2}
                      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? 'Updating...' : 'Update Points Table'}
                    </button>
                  </form>
                </Card>
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default PointsTable;
