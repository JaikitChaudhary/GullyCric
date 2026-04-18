import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addRun,
  addWicket,
  checkInningsTransition,
  checkMatchResult,
  formatOversFromBalls,
  getBallsLimit,
  serializeMatch,
  undoLastAction,
} from './scoringService.js';

const createMatch = (overrides = {}) => ({
  name: 'Test Match',
  totalRuns: 0,
  wickets: 0,
  balls: 0,
  maxOvers: 2,
  innings: 1,
  firstInningsScore: 0,
  target: 0,
  isCompleted: false,
  result: '',
  history: [],
  previousInningsState: null,
  ...overrides,
});

test('add runs updates score and history', () => {
  const match = createMatch();

  const event = addRun(match, 4);

  assert.equal(event.type, 'scoreUpdate');
  assert.equal(match.totalRuns, 4);
  assert.equal(match.balls, 1);
  assert.deepEqual(match.history[0], { type: 'run', value: 4 });
});

test('add wicket updates wickets and history', () => {
  const match = createMatch();

  const event = addWicket(match);

  assert.equal(event.type, 'scoreUpdate');
  assert.equal(match.wickets, 1);
  assert.equal(match.balls, 1);
  assert.deepEqual(match.history[0], { type: 'wicket', value: 1 });
});

test('undo reverses a run', () => {
  const match = createMatch();

  addRun(match, 6);
  const result = undoLastAction(match);

  assert.equal(result.type, 'scoreUpdate');
  assert.equal(result.lastAction.type, 'run');
  assert.equal(match.totalRuns, 0);
  assert.equal(match.balls, 0);
});

test('undo reverses a wicket', () => {
  const match = createMatch();

  addWicket(match);
  const result = undoLastAction(match);

  assert.equal(result.lastAction.type, 'wicket');
  assert.equal(match.wickets, 0);
  assert.equal(match.balls, 0);
});

test('overs increment after 6 legal balls', () => {
  const match = createMatch();

  for (let ball = 0; ball < 6; ball += 1) {
    addRun(match, 1);
  }

  assert.equal(match.innings, 1);
  assert.equal(formatOversFromBalls(match.balls), '1.0');
});

test('first innings switches properly at the over limit', () => {
  const match = createMatch({ maxOvers: 1, balls: 6, totalRuns: 12, history: [{ type: 'run', value: 4 }] });

  const event = checkInningsTransition(match);

  assert.equal(event.type, 'inningsChange');
  assert.equal(match.innings, 2);
  assert.equal(match.firstInningsScore, 12);
  assert.equal(match.target, 13);
  assert.equal(match.totalRuns, 0);
  assert.equal(match.balls, 0);
  assert.deepEqual(match.history, []);
});

test('innings also switches after the 6th ball is bowled', () => {
  const match = createMatch({ maxOvers: 1 });

  let event;
  for (let ball = 0; ball < 6; ball += 1) {
    event = addRun(match, 1);
  }

  assert.equal(event.type, 'inningsChange');
  assert.equal(match.innings, 2);
  assert.equal(match.firstInningsScore, 6);
  assert.equal(match.target, 7);
});

test('second innings ends correctly when target is chased', () => {
  const match = createMatch({ innings: 2, target: 10 });

  addRun(match, 4);
  addRun(match, 4);
  const event = addRun(match, 2);

  assert.equal(event.type, 'matchEnd');
  assert.equal(match.isCompleted, true);
  assert.equal(match.result, 'Team 2 won');
});

test('second innings ends correctly when overs finish', () => {
  const match = createMatch({ innings: 2, target: 10, maxOvers: 1, totalRuns: 7, balls: 5, history: [{ type: 'run', value: 4 }] });

  const event = addRun(match, 1);

  assert.equal(event.type, 'matchEnd');
  assert.equal(match.isCompleted, true);
  assert.equal(match.result, 'Team 1 won');
});

test('second innings is a draw when scores are level at the ball limit', () => {
  const match = createMatch({ innings: 2, target: 10, maxOvers: 1, totalRuns: 8, balls: 5, history: [{ type: 'run', value: 2 }] });

  const event = addRun(match, 1);

  assert.equal(event.type, 'matchEnd');
  assert.equal(match.isCompleted, true);
  assert.equal(match.result, 'Match Draw');
});

test('undo after innings change restores first innings and last action', () => {
  const match = createMatch({ maxOvers: 1 });

  for (let ball = 0; ball < 6; ball += 1) {
    addRun(match, 1);
  }

  const result = undoLastAction(match);

  assert.equal(result.lastAction.type, 'run');
  assert.equal(match.innings, 1);
  assert.equal(match.totalRuns, 5);
  assert.equal(match.balls, 5);
});

test('checkMatchResult can complete a second innings directly', () => {
  const match = createMatch({ innings: 2, target: 20, totalRuns: 20 });

  const event = checkMatchResult(match);

  assert.equal(event.type, 'matchEnd');
  assert.equal(match.result, 'Team 2 won');
});

test('serializeMatch preserves plain objects and mongoose-like docs', () => {
  const plainMatch = createMatch();
  assert.equal(serializeMatch(plainMatch), plainMatch);

  const serialized = serializeMatch({
    toObject: () => ({ id: 'abc', currentOver: '0.0' }),
  });

  assert.deepEqual(serialized, { id: 'abc', currentOver: '0.0' });
});

test('getBallsLimit converts overs to balls', () => {
  assert.equal(getBallsLimit(1), 6);
  assert.equal(getBallsLimit(20), 120);
});
