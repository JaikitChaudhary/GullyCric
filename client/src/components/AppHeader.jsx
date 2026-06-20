import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

function AppHeader({ title, backTo = '', actionLabel = '', actionIcon = '', onAction }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  };

  return (
    <header className="theme-surface sticky top-3 z-10 rounded-[1.35rem] border px-3 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="theme-secondary-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg font-semibold"
        >
          ←
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-white">{title}</h1>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            aria-label={actionLabel}
            className="theme-secondary-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg"
          >
            {actionIcon}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Home"
          className="theme-secondary-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg"
        >
          ⌂
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export default AppHeader;
