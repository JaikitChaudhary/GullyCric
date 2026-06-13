import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { getOrCreateDeviceId } from '../utils/deviceId.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function CreateTournament() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [overs, setOvers] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !startDate || Number(overs) < 1) {
      setError('Please enter a tournament name, start date, and valid overs.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo: logo.trim(),
          startDate,
          overs: Number(overs),
          createdBy: getOrCreateDeviceId(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to create tournament');
        return;
      }

      navigate(`/tournaments/${data.id}`);
    } catch (err) {
      setError('Server error while creating tournament.');
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
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Create Tournament</p>
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

            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">New Tournament</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Tournament Setup</h1>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    placeholder="Sunday Premier League"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Logo URL</span>
                  <input
                    value={logo}
                    onChange={(event) => setLogo(event.target.value)}
                    className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    placeholder="https://example.com/logo.png"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="theme-input mt-2 w-full rounded-[1.25rem] border px-3 py-3 outline-none focus:border-orange-300/60"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200">Overs</span>
                    <input
                      type="number"
                      min="1"
                      value={overs}
                      onChange={(event) => setOvers(event.target.value)}
                      className="theme-input mt-2 w-full rounded-[1.25rem] border px-3 py-3 outline-none focus:border-orange-300/60"
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Tournament'}
                </button>
              </form>
            </Card>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default CreateTournament;
