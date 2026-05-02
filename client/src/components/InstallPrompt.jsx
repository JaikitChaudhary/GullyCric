function InstallPrompt({ canInstall, onInstall }) {
  if (!canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition duration-200 hover:scale-105 hover:bg-emerald-400/20 active:scale-95 sm:px-4 sm:text-sm"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span>Install App</span>
    </button>
  );
}

export default InstallPrompt;
