const scoringButtons = [0, 1, 2, 3, 4, 6];

function ActionButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function ActionBar({ disabled, isOwner, loadingAction, onRun, onUndo, onWicket, onWide }) {
  if (!isOwner) {
    return (
      <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 px-4 py-5 text-center text-sm font-semibold uppercase tracking-[0.22em] text-orange-100 shadow-[0_18px_50px_rgba(249,115,22,0.08)] backdrop-blur">
        View Only Mode
      </div>
    );
  }

  return (
    <div className="sticky bottom-3 z-20 -mx-1 rounded-[1.75rem] border border-orange-300/10 bg-slate-950/88 p-3 shadow-[0_24px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="flex flex-wrap gap-2">
        {scoringButtons.map((score) => (
          <ActionButton
            key={score}
            disabled={loadingAction || disabled}
            onClick={() => onRun(score)}
            className="flex-1 basis-[calc(20%-0.5rem)] border border-orange-300/15 bg-slate-900/90 text-slate-100 hover:border-orange-300/40 hover:bg-slate-800"
          >
            {score}
          </ActionButton>
        ))}
        <ActionButton
          disabled={loadingAction || disabled}
          onClick={onWide}
          className="flex-1 basis-[calc(20%-0.5rem)] border border-amber-200/25 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-[0_10px_25px_rgba(251,191,36,0.22)]"
        >
          WD
        </ActionButton>
        <ActionButton
          disabled={loadingAction || disabled}
          onClick={onWicket}
          className="flex-1 basis-[calc(20%-0.5rem)] bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_10px_25px_rgba(244,63,94,0.28)]"
        >
          W
        </ActionButton>
        <ActionButton
          disabled={loadingAction}
          onClick={onUndo}
          className="flex-1 basis-[calc(20%-0.5rem)] border border-slate-600/80 bg-slate-700/90 text-slate-100"
        >
          Undo
        </ActionButton>
      </div>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.22em] text-slate-400">
        {loadingAction ? 'Updating' : disabled ? 'Match Over' : 'Real-time Scoring Active'}
      </p>
    </div>
  );
}

export default ActionBar;
