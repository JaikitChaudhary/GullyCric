const scoringButtons = [0, 1, 2, 3, 4, 6];

function Controls({ disabled, isOwner, loadingAction, onRun, onUndo, onWicket }) {
  if (!isOwner) {
    return (
      <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 px-4 py-5 text-center text-sm font-semibold uppercase tracking-[0.22em] text-orange-100 shadow-[0_18px_50px_rgba(249,115,22,0.08)] backdrop-blur">
        View Only Mode
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {scoringButtons.map((score) => (
          <button
            key={score}
            type="button"
            disabled={loadingAction || disabled}
            onClick={() => onRun(score)}
            className="rounded-full border border-orange-300/15 bg-slate-900/90 px-4 py-4 text-lg font-semibold text-slate-100 shadow-[0_16px_36px_rgba(2,6,23,0.45)] transition-all duration-200 hover:scale-105 hover:border-orange-300/40 hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {score}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={loadingAction || disabled}
          onClick={onWicket}
          className="rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_42px_rgba(244,63,94,0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_22px_52px_rgba(244,63,94,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Wicket
        </button>
        <button
          type="button"
          disabled={loadingAction}
          onClick={onUndo}
          className="rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 shadow-[0_16px_34px_rgba(249,115,22,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_20px_44px_rgba(249,115,22,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo
        </button>
        <div className="rounded-full border border-orange-300/10 bg-slate-900/80 px-4 py-4 text-center text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur">
          {loadingAction ? 'Updating...' : disabled ? 'Match over' : 'Real-time scoring active'}
        </div>
      </div>
    </div>
  );
}

export default Controls;
