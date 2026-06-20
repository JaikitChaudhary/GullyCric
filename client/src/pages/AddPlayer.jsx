import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function AddPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nickName, setNickName] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !mobile.trim()) {
      setError('Please enter player name and mobile.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/tournaments/${id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nickName: nickName.trim(),
          mobile: mobile.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to add player');
        return;
      }

      navigate(`/tournaments/${id}/players`);
    } catch (err) {
      setError('Server error while adding player.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <AppHeader title="Add Player" backTo={`/tournaments/${id}/players`} />

          <main className="mt-6 space-y-5">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Player Pool</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Add Player</h1>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    placeholder="Player name"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Nick Name</span>
                  <input
                    value={nickName}
                    onChange={(event) => setNickName(event.target.value)}
                    className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    placeholder="Short name"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Mobile</span>
                  <input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
                    placeholder="Mobile number"
                    inputMode="tel"
                  />
                </label>

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
                  {submitting ? 'Adding...' : 'Add Player'}
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

export default AddPlayer;
