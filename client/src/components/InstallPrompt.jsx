function InstallPrompt({ canInstall, onInstall }) {
  if (!canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition duration-200 hover:scale-105 hover:bg-emerald-400/20 active:scale-95"
    >
      Install App
    </button>
  );
}

export default InstallPrompt;
