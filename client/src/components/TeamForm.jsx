import { useMemo, useState } from 'react';

function TeamForm({
  players = [],
  teams = [],
  currentTeamId = '',
  initialTeamName = '',
  initialCaptainPlayerId = '',
  initialPlayerIds = [],
  submitting = false,
  error = '',
  submitLabel = 'Save Team',
  onSubmit,
}) {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [captainPlayerId, setCaptainPlayerId] = useState(initialCaptainPlayerId);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(initialPlayerIds);

  const assignedPlayerIds = useMemo(() => {
    const assignedIds = new Set();

    teams
      .filter((team) => team.id !== currentTeamId)
      .forEach((team) => {
        (team.playerIds || []).forEach((playerId) => assignedIds.add(playerId));
      });

    return assignedIds;
  }, [currentTeamId, teams]);

  const togglePlayer = (playerId) => {
    if (assignedPlayerIds.has(playerId)) {
      return;
    }

    setSelectedPlayerIds((current) => {
      if (current.includes(playerId)) {
        if (playerId === captainPlayerId) {
          setCaptainPlayerId('');
        }

        return current.filter((id) => id !== playerId);
      }

      return [...current, playerId];
    });
  };

  const handleCaptainChange = (nextCaptainPlayerId) => {
    setCaptainPlayerId(nextCaptainPlayerId);

    if (nextCaptainPlayerId && !selectedPlayerIds.includes(nextCaptainPlayerId)) {
      setSelectedPlayerIds((current) => [...current, nextCaptainPlayerId]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      teamName,
      captainPlayerId,
      playerIds: selectedPlayerIds,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Team Name</span>
        <input
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
          placeholder="Team name"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Captain</span>
        <select
          value={captainPlayerId}
          onChange={(event) => handleCaptainChange(event.target.value)}
          className="theme-input mt-2 w-full rounded-[1.25rem] border px-4 py-3 outline-none focus:border-orange-300/60"
        >
          <option value="">Select captain</option>
          {players.map((player) => (
            <option
              key={player.id}
              value={player.id}
              disabled={assignedPlayerIds.has(player.id)}
            >
              {player.name}
            </option>
          ))}
        </select>
      </label>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Players</p>
            <p className="mt-1 text-xs text-slate-400">{selectedPlayerIds.length} selected</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {players.length === 0 && (
            <p className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              Add players to the tournament pool first.
            </p>
          )}

          {players.map((player) => {
            const isAssigned = assignedPlayerIds.has(player.id);
            const isSelected = selectedPlayerIds.includes(player.id);

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                disabled={isAssigned}
                className={`flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
                  isSelected
                    ? 'border-orange-300/40 bg-orange-400/10'
                    : 'border-white/8 bg-white/[0.03]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                    isSelected
                      ? 'border-orange-300 bg-orange-300 text-slate-950'
                      : 'border-white/20 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-white">{player.name}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {isAssigned ? 'Already in another team' : `${player.nickName ? `${player.nickName} · ` : ''}${player.mobile}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="rounded-[1.25rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || players.length === 0}
        className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

export default TeamForm;
