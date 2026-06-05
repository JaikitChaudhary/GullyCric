const MAX_WICKETS = 10;
const MAX_UNDOS_PER_SCORING_SEQUENCE = 2;

const getBallsLimit = (maxOvers) => Number(maxOvers) * 6;

const formatOversFromBalls = (balls) => {
  const safeBalls = Math.max(0, Number(balls) || 0);
  return `${Math.floor(safeBalls / 6)}.${safeBalls % 6}`;
};

const cloneHistory = (history = []) => history.map((entry) => ({ ...entry }));

const cloneMatch = (match) => ({
  ...match,
  history: cloneHistory(match.history),
  previousInningsState: match.previousInningsState
    ? {
        ...match.previousInningsState,
        history: cloneHistory(match.previousInningsState.history),
      }
    : null,
});

const getEventRuns = (entry) => {
  if (typeof entry?.runs === 'number') {
    return entry.runs;
  }

  if (entry?.type === 'run') {
    return Number(entry?.value) || 0;
  }

  if (entry?.type === 'wide' || entry?.type === 'WD') {
    return Number(entry?.value) || 1;
  }

  return 0;
};

const isBallEvent = (entry) => {
  if (typeof entry?.isBall === 'boolean') {
    return entry.isBall;
  }

  return entry?.type === 'run' || entry?.type === 'wicket';
};

const getEventWickets = (entry) => {
  if (entry?.type !== 'wicket') {
    return 0;
  }

  return Number(entry?.value) || 1;
};

const syncMatchStateFromHistory = (match) => {
  const history = Array.isArray(match.history) ? match.history : [];

  match.totalRuns = history.reduce((total, entry) => total + getEventRuns(entry), 0);
  match.balls = history.reduce((total, entry) => total + (isBallEvent(entry) ? 1 : 0), 0);
  match.wickets = history.reduce((total, entry) => total + getEventWickets(entry), 0);
  match.currentOver = formatOversFromBalls(match.balls);
  match.ballsLimit = getBallsLimit(match.maxOvers);
  match.overs = match.currentOver;
};

const isInningsClosed = (match) =>
  match.balls >= getBallsLimit(match.maxOvers) || match.wickets >= MAX_WICKETS;

const isBallLimitReached = (match) => match.balls >= getBallsLimit(match.maxOvers);

const resetCompletedState = (match) => {
  match.isCompleted = false;
  match.result = '';
};

const applyBallOutcome = (match) => {
  resetCompletedState(match);

  if (match.innings === 1 && isInningsClosed(match)) {
    match.previousInningsState = {
      innings: 1,
      totalRuns: match.totalRuns,
      wickets: match.wickets,
      balls: match.balls,
      history: cloneHistory(match.history),
    };
    match.firstInningsScore = match.totalRuns;
    match.target = match.totalRuns + 1;
    match.innings = 2;
    match.totalRuns = 0;
    match.wickets = 0;
    match.balls = 0;
    match.history = [];
    syncMatchStateFromHistory(match);
    return;
  }

  if (match.innings !== 2) {
    return;
  }

  const firstInningsBattingTeam = match.battingTeam || match.teamAName || 'Team 1';
  const secondInningsBattingTeam = match.bowlingTeam || match.teamBName || 'Team 2';

  if (match.totalRuns >= match.target) {
    match.isCompleted = true;
    match.result = `${secondInningsBattingTeam} won`;
    return;
  }

  if (isBallLimitReached(match) && match.totalRuns === match.target - 1) {
    match.isCompleted = true;
    match.result = 'Match Draw';
    return;
  }

  if (isInningsClosed(match)) {
    match.isCompleted = true;
    match.result = `${firstInningsBattingTeam} won`;
  }
};

const assertCanScore = (match) => {
  if (match.isCompleted) {
    throw new Error('Match is already completed');
  }

  if (isInningsClosed(match)) {
    throw new Error('Current innings is already closed');
  }
};

const restoreFirstInningsState = (match) => {
  match.innings = match.previousInningsState.innings;
  match.totalRuns = match.previousInningsState.totalRuns;
  match.wickets = match.previousInningsState.wickets;
  match.balls = match.previousInningsState.balls;
  match.history = cloneHistory(match.previousInningsState.history);
  match.firstInningsScore = 0;
  match.target = 0;
  match.previousInningsState = null;
  syncMatchStateFromHistory(match);
};

export const applyLocalScoreAction = (currentMatch, action, payload = {}) => {
  if (!currentMatch) {
    return currentMatch;
  }

  const match = cloneMatch(currentMatch);

  if (action === 'run') {
    const runs = Number(payload.runs);

    if (!Number.isInteger(runs) || runs < 0) {
      throw new Error('Runs must be a non-negative integer');
    }

    assertCanScore(match);
    match.history.push({ type: 'run', value: runs, runs, isBall: true });
    syncMatchStateFromHistory(match);
    match.undoCount = 0;
    applyBallOutcome(match);
    return match;
  }

  if (action === 'wicket') {
    assertCanScore(match);
    match.history.push({ type: 'wicket', value: 1, runs: 0, isBall: true });
    syncMatchStateFromHistory(match);
    match.undoCount = 0;
    applyBallOutcome(match);
    return match;
  }

  if (action === 'wide') {
    assertCanScore(match);
    match.history.push({ type: 'WD', value: 1, runs: 1, isBall: false });
    syncMatchStateFromHistory(match);
    match.undoCount = 0;
    applyBallOutcome(match);
    return match;
  }

  if (action === 'undo') {
    const undoCount = Number(match.undoCount) || 0;

    if (undoCount >= MAX_UNDOS_PER_SCORING_SEQUENCE) {
      throw new Error('Only the last 2 balls can be undone');
    }

    if (match.innings === 2 && match.history.length === 0 && match.previousInningsState) {
      restoreFirstInningsState(match);
    }

    const lastAction = match.history.pop();

    if (!lastAction) {
      throw new Error('No actions to undo');
    }

    syncMatchStateFromHistory(match);
    resetCompletedState(match);
    match.undoCount = undoCount + 1;
    return match;
  }

  return match;
};
