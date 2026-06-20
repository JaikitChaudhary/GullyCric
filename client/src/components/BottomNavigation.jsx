import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Home', icon: '⌂', path: '/', match: (pathname) => pathname === '/' },
  { label: 'Tournament', icon: '🏆', path: '/tournaments', match: (pathname) => pathname.startsWith('/tournaments') && !pathname.includes('/players') },
  { label: 'Match', icon: '🏏', path: '/match', match: (pathname) => pathname === '/match' || pathname.startsWith('/match/') },
  { label: 'Players', icon: '👥', path: '/players', match: (pathname) => pathname === '/players' || pathname.includes('/players') },
  { label: 'Profile', icon: '○', path: '/profile', match: (pathname) => pathname === '/profile' },
];

function BottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="theme-surface mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.5rem] border p-2 backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = tab.match(pathname);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              aria-label={tab.label}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 text-[0.66rem] font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 shadow-[0_12px_28px_rgba(249,115,22,0.25)]'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[1.15rem] leading-none" aria-hidden="true">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
