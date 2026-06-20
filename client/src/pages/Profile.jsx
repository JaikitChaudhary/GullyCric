import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import Card from '../components/Card.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { getOrCreateDeviceId } from '../utils/deviceId.js';

function Profile() {
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  return (
    <div className="theme-text min-h-screen p-4">
      <div className="mx-auto min-h-screen w-full max-w-md">
        <div className="theme-surface-strong min-h-screen rounded-[2rem] border p-5 backdrop-blur-xl">
          <header className="theme-surface sticky top-4 z-10 rounded-[1.75rem] border px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo heightClassName="h-9" nameClassName="text-2xl" priority />
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-orange-200/75">Profile</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 space-y-5">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300/70">Device Profile</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">GullyCric</h1>
              <p className="mt-2 break-all text-sm leading-6 text-slate-300">{deviceId}</p>
            </Card>

            <div className="grid gap-3">
              <Link
                to="/match"
                className="theme-card rounded-[1.5rem] border p-4 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              >
                Match History
              </Link>
              <Link
                to="/tournaments"
                className="theme-card rounded-[1.5rem] border p-4 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              >
                Tournaments
              </Link>
              <Link
                to="/players"
                className="theme-card rounded-[1.5rem] border p-4 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              >
                Player Pools
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Profile;
