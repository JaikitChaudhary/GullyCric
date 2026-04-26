export const MAX_WICKETS = 10;

export const getBallsLimit = (maxOvers) => Number(maxOvers) * 6;

export const formatOversFromBalls = (balls) => {
  const safeBalls = Math.max(0, Number(balls) || 0);
  return `${Math.floor(safeBalls / 6)}.${safeBalls % 6}`;
};

export const serializeMatch = (match) => {
  if (!match) {
    return match;
  }

  if (typeof match.toObject === 'function') {
    return match.toObject({ virtuals: true });
  }

  return match;
};

const cloneHistory = (history = []) => history.map((entry) => ({ ...entry }));

const createHistoryEntry = ({ type, value, runs, isBall }) => ({ type, value, runs, isBall });

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
  const history = Array.isArray(match?.history) ? match.history : [];

  match.totalRuns = history.reduce((total, entry) => total + getEventRuns(entry), 0);
  match.balls = history.reduce((total, entry) => total + (isBallEvent(entry) ? 1 : 0), 0);
  match.wickets = history.reduce((total, entry) => total + getEventWickets(entry), 0);
};

const isInningsClosed = (match) =>
  match.balls >= getBallsLimit(match.maxOvers) || match.wickets >= MAX_WICKETS;

const isBallLimitReached = (match) => match.balls >= getBallsLimit(match.maxOvers);

const resetCompletedState = (match) => {
  match.isCompleted = false;
  match.result = '';
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
};

const assertCanScore = (match) => {
  if (match.isCompleted) {
    throw new Error('Match is already completed');
  }

  if (isInningsClosed(match)) {
    throw new Error('Current innings is already closed');
  }
};

export const checkInningsTransition = (match) => {
  if (match.innings !== 1 || !isInningsClosed(match)) {
    return { type: 'scoreUpdate' };
  }

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

  return { type: 'inningsChange' };
};

export const checkMatchResult = (match) => {
  if (match.innings !== 2) {
    return { type: 'scoreUpdate' };
  }

  const teamAName = match.teamAName || 'Team 1';
  const teamBName = match.teamBName || 'Team 2';

  if (match.totalRuns >= match.target) {
    match.isCompleted = true;
    match.result = `${teamBName} won`;
    return { type: 'matchEnd' };
  }

  if (isBallLimitReached(match) && match.totalRuns === match.target - 1) {
    match.isCompleted = true;
    match.result = 'Match Draw';
    return { type: 'matchEnd' };
  }

  if (isInningsClosed(match)) {
    match.isCompleted = true;
    match.result = `${teamAName} won`;
    return { type: 'matchEnd' };
  }

  return { type: 'scoreUpdate' };
};

const applyBallOutcome = (match) => {
  resetCompletedState(match);

  if (match.innings === 1) {
    return checkInningsTransition(match);
  }

  return checkMatchResult(match);
};

export const addRun = (match, runs) => {
  const parsedRuns = Number(runs);

  if (!Number.isInteger(parsedRuns) || parsedRuns < 0) {
    throw new Error('Runs must be a non-negative integer');
  }

  assertCanScore(match);

  match.history.push(
    createHistoryEntry({
      type: 'run',
      value: parsedRuns,
      runs: parsedRuns,
      isBall: true,
    })
  );
  syncMatchStateFromHistory(match);

  return applyBallOutcome(match);
};

export const addWicket = (match) => {
  assertCanScore(match);

  match.history.push(
    createHistoryEntry({
      type: 'wicket',
      value: 1,
      runs: 0,
      isBall: true,
    })
  );
  syncMatchStateFromHistory(match);

  return applyBallOutcome(match);
};

export const addWide = (match) => {
  assertCanScore(match);

  match.history.push(
    createHistoryEntry({
      type: 'WD',
      value: 1,
      runs: 1,
      isBall: false,
    })
  );
  syncMatchStateFromHistory(match);

  return applyBallOutcome(match);
};

export const undoLastAction = (match) => {
  if (match.innings === 2 && match.history.length === 0 && match.previousInningsState) {
    restoreFirstInningsState(match);
  }

  const lastAction = match.history.pop();

  if (!lastAction) {
    return null;
  }
  syncMatchStateFromHistory(match);

  resetCompletedState(match);

  return { type: 'scoreUpdate', lastAction };
};
