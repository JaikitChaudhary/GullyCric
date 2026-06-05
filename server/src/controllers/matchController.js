import Match from '../models/Match.js';
import crypto from 'node:crypto';
import {
  addRun as addRunToMatch,
  addWide as addWideToMatch,
  addWicket as addWicketToMatch,
  serializeMatch,
  undoLastAction,
} from '../services/scoringService.js';
import { emitMatchEvent } from '../socket/matchSocket.js';

const buildMatchResponse = (match, { includeOwnerToken = false } = {}) => {
  const serializedMatch = serializeMatch(match);

  if (!includeOwnerToken) {
    delete serializedMatch.ownerToken;
  }

  delete serializedMatch.scoringEventIds;

  if (!includeOwnerToken) {
    return serializedMatch;
  }

  return serializedMatch;
};

const generateMatchCode = async () => {
  let matchCode;
  let existingMatch;

  do {
    const suffix = crypto.randomBytes(3).toString('hex').slice(0, 4);
    matchCode = `gully-${suffix}`;
    existingMatch = await Match.exists({ matchCode });
  } while (existingMatch);

  return matchCode;
};

const findMatchByCode = (matchCode) => Match.findOne({ matchCode });

const findMatchByCodeWithOwnerToken = (matchCode) => Match.findOne({ matchCode }).select('+ownerToken +scoringEventIds');

const requireOwnerAccess = (request, reply, match) => {
  const ownerToken = request.headers['x-owner-token'];

  if (!ownerToken || ownerToken !== match.ownerToken) {
    reply.status(403).send({ error: 'Only the match owner can update the score' });
    return false;
  }

  return true;
};

const getScoringEventId = (request) => {
  const headerEventId = request.headers['x-scoring-event-id'];
  const bodyEventId = request.body?.scoringEventId;
  const scoringEventId = Array.isArray(headerEventId) ? headerEventId[0] : headerEventId || bodyEventId;

  return typeof scoringEventId === 'string' ? scoringEventId.trim() : '';
};

const isDuplicateScoringEvent = (match, scoringEventId) =>
  Boolean(scoringEventId && Array.isArray(match.scoringEventIds) && match.scoringEventIds.includes(scoringEventId));

const rememberScoringEvent = (match, scoringEventId) => {
  if (!scoringEventId) {
    return;
  }

  match.scoringEventIds = [...(match.scoringEventIds || []), scoringEventId].slice(-500);
};

const getTeamNames = (match) => [match.teamAName || 'Team 1', match.teamBName || 'Team 2'];

const isMatchStarted = (match) =>
  match.totalRuns > 0 ||
  match.wickets > 0 ||
  match.balls > 0 ||
  match.innings > 1 ||
  (Array.isArray(match.history) && match.history.length > 0);

const emitScoringEvents = (request, match, scoringEvent) => {
  const serializedMatch = buildMatchResponse(match);

  emitMatchEvent(request, 'scoreUpdate', serializedMatch);

  if (scoringEvent?.type === 'inningsChange') {
    emitMatchEvent(request, 'inningsChange', serializedMatch);
  }

  if (scoringEvent?.type === 'matchEnd') {
    emitMatchEvent(request, 'matchEnd', serializedMatch);
  }
};

export const createMatch = async (request, reply) => {
  try {
    const { name, teamAName, teamBName, overs, deviceId } = request.body;
    const parsedOvers = Number(overs);
    const sanitizedTeamAName = teamAName?.trim();
    const sanitizedTeamBName = teamBName?.trim();
    const sanitizedDeviceId = deviceId?.trim();
    const matchName = name?.trim() || `${sanitizedTeamAName} vs ${sanitizedTeamBName}`;

    if (!sanitizedTeamAName || !sanitizedTeamBName || !Number.isInteger(parsedOvers) || parsedOvers < 1) {
      return reply.status(400).send({ error: 'Team names and overs are required' });
    }

    const matchCode = await generateMatchCode();

    const match = await Match.create({
      name: matchName,
      teamAName: sanitizedTeamAName,
      teamBName: sanitizedTeamBName,
      matchCode,
      ownerToken: crypto.randomBytes(24).toString('hex'),
      ...(sanitizedDeviceId ? { deviceId: sanitizedDeviceId } : {}),
      maxOvers: parsedOvers,
      totalRuns: 0,
      wickets: 0,
      balls: 0,
      innings: 1,
      firstInningsScore: 0,
      target: 0,
      isCompleted: false,
      undoCount: 0,
      result: '',
      tossWinner: null,
      decision: null,
      battingTeam: null,
      bowlingTeam: null,
      history: [],
      scoringEventIds: [],
    });

    const io = request.server.io;
    if (io) {
      io.emit('newMatch', buildMatchResponse(match));
    }

    return reply.status(201).send(buildMatchResponse(match, { includeOwnerToken: true }));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create match' });
  }
};

export const listMatches = async (request, reply) => {
  try {
    const deviceId = request.query.deviceId?.trim();

    if (!deviceId) {
      return reply.status(400).send({ error: 'deviceId is required' });
    }

    const matches = await Match.find({ deviceId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20);

    return reply.send(matches.map((match) => buildMatchResponse(match)));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch matches' });
  }
};

export const deleteMatch = async (request, reply) => {
  try {
    const { code } = request.params;
    const deviceId = request.query.deviceId?.trim();

    if (!deviceId) {
      return reply.status(400).send({ error: 'deviceId is required' });
    }

    const match = await Match.findOne({ matchCode: code, deviceId, isDeleted: false });

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    match.isDeleted = true;
    await match.save();

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete match' });
  }
};

export const getMatch = async (request, reply) => {
  try {
    const { code } = request.params;
    const match = await findMatchByCode(code);

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch match' });
  }
};

export const setToss = async (request, reply) => {
  try {
    const { code } = request.params;
    const { tossWinner, decision, skipToss } = request.body || {};
    const match = await findMatchByCodeWithOwnerToken(code);

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!requireOwnerAccess(request, reply, match)) {
      return;
    }

    if (isMatchStarted(match)) {
      return reply.status(400).send({ error: 'Toss can only be set before scoring starts' });
    }

    const [teamAName, teamBName] = getTeamNames(match);

    if (skipToss) {
      match.tossWinner = null;
      match.decision = null;
      match.battingTeam = teamAName;
      match.bowlingTeam = teamBName;
    } else {
      const normalizedTossWinner = tossWinner?.trim();
      const normalizedDecision = decision?.trim().toLowerCase();

      if (![teamAName, teamBName].includes(normalizedTossWinner)) {
        return reply.status(400).send({ error: 'Toss winner must be one of the match teams' });
      }

      if (!['bat', 'bowl'].includes(normalizedDecision)) {
        return reply.status(400).send({ error: 'Decision must be bat or bowl' });
      }

      const otherTeam = normalizedTossWinner === teamAName ? teamBName : teamAName;
      match.tossWinner = normalizedTossWinner;
      match.decision = normalizedDecision;
      match.battingTeam = normalizedDecision === 'bat' ? normalizedTossWinner : otherTeam;
      match.bowlingTeam = normalizedDecision === 'bat' ? otherTeam : normalizedTossWinner;
    }

    await match.save();
    emitMatchEvent(request, 'scoreUpdate', buildMatchResponse(match));

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to save toss' });
  }
};

export const addRun = async (request, reply) => {
  try {
    const { code } = request.params;
    const { runs } = request.body;
    const parsedRuns = Number(runs);

    if (!Number.isInteger(parsedRuns) || parsedRuns < 0) {
      return reply.status(400).send({ error: 'Runs must be a non-negative integer' });
    }

    const match = await findMatchByCodeWithOwnerToken(code);
    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!requireOwnerAccess(request, reply, match)) {
      return;
    }

    const scoringEventId = getScoringEventId(request);
    if (isDuplicateScoringEvent(match, scoringEventId)) {
      return reply.send(buildMatchResponse(match));
    }

    let scoringEvent;
    try {
      scoringEvent = addRunToMatch(match, parsedRuns);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }

    rememberScoringEvent(match, scoringEventId);
    await match.save();
    emitScoringEvents(request, match, scoringEvent);

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to add runs' });
  }
};

export const addWicket = async (request, reply) => {
  try {
    const { code } = request.params;
    const match = await findMatchByCodeWithOwnerToken(code);

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!requireOwnerAccess(request, reply, match)) {
      return;
    }

    const scoringEventId = getScoringEventId(request);
    if (isDuplicateScoringEvent(match, scoringEventId)) {
      return reply.send(buildMatchResponse(match));
    }

    let scoringEvent;
    try {
      scoringEvent = addWicketToMatch(match);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }

    rememberScoringEvent(match, scoringEventId);
    await match.save();
    emitScoringEvents(request, match, scoringEvent);

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to add wicket' });
  }
};

export const addWide = async (request, reply) => {
  try {
    const { code } = request.params;
    const match = await findMatchByCodeWithOwnerToken(code);

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!requireOwnerAccess(request, reply, match)) {
      return;
    }

    const scoringEventId = getScoringEventId(request);
    if (isDuplicateScoringEvent(match, scoringEventId)) {
      return reply.send(buildMatchResponse(match));
    }

    let scoringEvent;
    try {
      scoringEvent = addWideToMatch(match);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }

    rememberScoringEvent(match, scoringEventId);
    await match.save();
    emitScoringEvents(request, match, scoringEvent);

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to add wide' });
  }
};

export const undoAction = async (request, reply) => {
  try {
    const { code } = request.params;
    const match = await findMatchByCodeWithOwnerToken(code);

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!requireOwnerAccess(request, reply, match)) {
      return;
    }

    const scoringEventId = getScoringEventId(request);
    if (isDuplicateScoringEvent(match, scoringEventId)) {
      return reply.send(buildMatchResponse(match));
    }

    let undoResult;
    try {
      undoResult = undoLastAction(match);
      if (!undoResult) {
        return reply.status(400).send({ error: 'No actions to undo' });
      }
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }

    rememberScoringEvent(match, scoringEventId);
    await match.save();
    emitMatchEvent(request, 'scoreUpdate', buildMatchResponse(match));

    return reply.send(buildMatchResponse(match));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to undo last action' });
  }
};
