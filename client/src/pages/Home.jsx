import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import useOnlineStatus from '../hooks/useOnlineStatus.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const getOwnerTokenStorageKey = (matchCode) => `gullycric:ownerToken:${matchCode}`;

function Home() {
  const navigate = useNavigate();
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [overs, setOvers] = useState(20);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || overs <= 0) {
      setError('Please enter a match name and valid overs.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), overs }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to create match');
        return;
      }

      window.localStorage.setItem(getOwnerTokenStorageKey(data.matchCode), data.ownerToken);
      navigate(`/match/${data.matchCode}`);
    } catch (err) {
      setError('Server error while creating match.');
    }
  };

  return (
    <div className="min-h-screen p-4 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl md:p-8">
          <header className="sticky top-4 z-10 mb-8 rounded-[1.75rem] border border-white/10 bg-slate-950/50 px-5 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-300/75">Real-time Gully Cricket</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">GullyCric</h1>
                <p className="mt-2 max-w-2xl text-slate-300">Create a match, share the clean live link, and keep the score moving with a fast mobile-friendly scorer.</p>
              </div>
              <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
            </div>
          </header>

          {!isOnline && (
            <div className="mb-6">
              <OfflineNotice />
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-slate-950 transition duration-200 hover:scale-105 hover:bg-emerald-400 active:scale-95"
            >
              {showForm ? 'Hide Create Match' : 'Create Match'}
            </button>
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-6 animate-rise-in">
              <div>
                <label className="block text-sm font-medium text-slate-300">Match Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Enter match name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Overs</label>
                <input
                  type="number"
                  value={overs}
                  min="1"
                  onChange={(event) => setOvers(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <button type="submit" className="inline-flex items-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-105 hover:bg-cyan-400 active:scale-95">
                Save Match
              </button>
            </form>
          ) : (
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-slate-300">
                <p className="text-sm uppercase tracking-[0.22em] text-emerald-300/70">Live</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Fast Match Creation</h2>
                <p className="mt-3 text-sm leading-6">Create a fresh gully cricket match in seconds and jump straight into scoring.</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-slate-300">
                <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/70">Share</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Clean Match Links</h2>
                <p className="mt-3 text-sm leading-6">Every match gets a friendly shareable code so the whole group can follow along.</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-slate-300">
                <p className="text-sm uppercase tracking-[0.22em] text-amber-300/70">Control</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Owner-Based Scoring</h2>
                <p className="mt-3 text-sm leading-6">Only the creator can update the live score while everyone else stays in view-only mode.</p>
              </article>
              <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/60 p-8 text-center text-slate-300 md:col-span-3">
                <p>Create a match to start scoring and get a shareable link.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
