import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
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

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

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
          <AppHeader title="Create Tournament" backTo="/tournaments" />

          <main className="mt-6 space-y-5">
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
                  <span className="text-sm font-semibold text-slate-200">Logo Upload</span>
                  <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Tournament logo preview"
                        className="h-16 w-16 rounded-[1rem] object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-[1rem] border border-dashed border-orange-300/30 text-xl text-orange-100">
                        🏆
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block min-w-0 flex-1 text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-orange-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                    />
                  </div>
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
