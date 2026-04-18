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

const createHistoryEntry = (type, value) => ({ type, value });

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

  if (match.totalRuns >= match.target) {
    match.isCompleted = true;
    match.result = 'Team 2 won';
    return { type: 'matchEnd' };
  }

  if (isBallLimitReached(match) && match.totalRuns === match.target - 1) {
    match.isCompleted = true;
    match.result = 'Match Draw';
    return { type: 'matchEnd' };
  }

  if (isInningsClosed(match)) {
    match.isCompleted = true;
    match.result = 'Team 1 won';
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

  match.totalRuns += parsedRuns;
  match.balls += 1;
  match.history.push(createHistoryEntry('run', parsedRuns));

  return applyBallOutcome(match);
};

export const addWicket = (match) => {
  assertCanScore(match);

  match.wickets += 1;
  match.balls += 1;
  match.history.push(createHistoryEntry('wicket', 1));

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

  if (lastAction.type === 'run') {
    match.totalRuns = Math.max(0, match.totalRuns - lastAction.value);
    match.balls = Math.max(0, match.balls - 1);
  } else if (lastAction.type === 'wicket') {
    match.wickets = Math.max(0, match.wickets - lastAction.value);
    match.balls = Math.max(0, match.balls - 1);
  }

  resetCompletedState(match);

  return { type: 'scoreUpdate', lastAction };
};
