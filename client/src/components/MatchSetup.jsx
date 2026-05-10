function MatchSetup({
  teamAName,
  teamBName,
  overs,
  error,
  onTeamANameChange,
  onTeamBNameChange,
  onOversChange,
  onSubmit,
  submitting = false,
}) {
  return (
    <form onSubmit={onSubmit} className="theme-surface mt-6 space-y-4 rounded-[1.75rem] border p-6 animate-rise-in">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="theme-muted block text-sm font-medium">Team A Name</label>
          <input
            value={teamAName}
            onChange={(event) => onTeamANameChange(event.target.value)}
            className="theme-input mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            placeholder="Enter Team A"
          />
        </div>
        <div>
          <label className="theme-muted block text-sm font-medium">Team B Name</label>
          <input
            value={teamBName}
            onChange={(event) => onTeamBNameChange(event.target.value)}
            className="theme-input mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            placeholder="Enter Team B"
          />
        </div>
      </div>
      <div>
        <label className="theme-muted block text-sm font-medium">Overs</label>
        <input
          type="number"
          value={overs}
          min="1"
          onChange={(event) => onOversChange(Number(event.target.value))}
          className="theme-input mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Start Match'}
      </button>
    </form>
  );
}

export default MatchSetup;
