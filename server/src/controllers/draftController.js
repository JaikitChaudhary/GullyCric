import mongoose from 'mongoose';
import DraftSession from '../models/DraftSession.js';
import Player from '../models/Player.js';
import Tournament from '../models/Tournament.js';
import { emitDraftEvent } from '../socket/draftSocket.js';

const buildPlayerSummary = (player) => {
  if (!player) {
    return null;
  }

  return {
    id: player._id?.toString() || player.id,
    name: player.name,
    nickName: player.nickName || '',
    mobile: player.mobile,
  };
};

const buildDraftResponse = (draft) => {
  if (!draft) {
    return null;
  }

  const serializedDraft = draft?.toObject ? draft.toObject() : { ...draft };
  const teamAPlayerIds = Array.isArray(serializedDraft.teamAPlayerIds) ? serializedDraft.teamAPlayerIds : [];
  const teamBPlayerIds = Array.isArray(serializedDraft.teamBPlayerIds) ? serializedDraft.teamBPlayerIds : [];

  return {
    id: serializedDraft._id?.toString() || serializedDraft.id,
    tournamentId: serializedDraft.tournamentId?.toString(),
    captainAPlayerId: serializedDraft.captainAPlayerId?._id?.toString() || serializedDraft.captainAPlayerId?.toString(),
    captainBPlayerId: serializedDraft.captainBPlayerId?._id?.toString() || serializedDraft.captainBPlayerId?.toString(),
    teamAPlayerIds: teamAPlayerIds.map((player) => player?._id?.toString() || player?.toString()),
    teamBPlayerIds: teamBPlayerIds.map((player) => player?._id?.toString() || player?.toString()),
    currentTurn: serializedDraft.currentTurn,
    status: serializedDraft.status,
    captainA: buildPlayerSummary(serializedDraft.captainAPlayerId?._id ? serializedDraft.captainAPlayerId : null),
    captainB: buildPlayerSummary(serializedDraft.captainBPlayerId?._id ? serializedDraft.captainBPlayerId : null),
    teamAPlayers: teamAPlayerIds.filter((player) => player?._id).map((player) => buildPlayerSummary(player)),
    teamBPlayers: teamBPlayerIds.filter((player) => player?._id).map((player) => buildPlayerSummary(player)),
  };
};

const ensureTournamentExists = async (tournamentId) => {
  if (!mongoose.isValidObjectId(tournamentId)) {
    return false;
  }

  const tournament = await Tournament.findById(tournamentId).lean();

  return tournament || null;
};

const buildGlobalPlayerQuery = (tournament) => ({
  $or: [
    { createdBy: tournament.createdBy },
    { tournamentId: tournament._id },
  ],
});

const findDraft = (tournamentId) =>
  DraftSession.findOne({ tournamentId })
    .populate('captainAPlayerId')
    .populate('captainBPlayerId')
    .populate('teamAPlayerIds')
    .populate('teamBPlayerIds');

const validateCaptains = async ({ tournament, captainAPlayerId, captainBPlayerId }) => {
  if (
    !mongoose.isValidObjectId(captainAPlayerId) ||
    !mongoose.isValidObjectId(captainBPlayerId) ||
    captainAPlayerId === captainBPlayerId
  ) {
    return { error: 'Select two different captains' };
  }

  const captains = await Player.find({
    _id: { $in: [captainAPlayerId, captainBPlayerId] },
    ...buildGlobalPlayerQuery(tournament),
  }).lean();

  if (captains.length !== 2) {
    return { error: 'Captains must be selected from tournament players' };
  }

  return { captains };
};

export const getDraft = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;

    const tournament = await ensureTournamentExists(tournamentId);

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const draft = await findDraft(tournamentId);

    return reply.send({ draft: buildDraftResponse(draft) });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch draft' });
  }
};

export const startDraft = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const { captainAPlayerId, captainBPlayerId } = request.body || {};

    const tournament = await ensureTournamentExists(tournamentId);

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const validation = await validateCaptains({ tournament, captainAPlayerId, captainBPlayerId });

    if (validation.error) {
      return reply.status(400).send({ error: validation.error });
    }

    const draft = await DraftSession.findOneAndUpdate(
      { tournamentId },
      {
        tournamentId,
        captainAPlayerId,
        captainBPlayerId,
        teamAPlayerIds: [captainAPlayerId],
        teamBPlayerIds: [captainBPlayerId],
        currentTurn: 'A',
        status: 'active',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate('captainAPlayerId')
      .populate('captainBPlayerId')
      .populate('teamAPlayerIds')
      .populate('teamBPlayerIds');

    const response = buildDraftResponse(draft);
    emitDraftEvent(request, tournamentId, response);

    return reply.status(201).send(response);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to start draft' });
  }
};

export const pickDraftPlayer = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const { playerId } = request.body || {};

    if (!mongoose.isValidObjectId(playerId)) {
      return reply.status(400).send({ error: 'Select a valid player' });
    }

    const draft = await DraftSession.findOne({ tournamentId });

    if (!draft) {
      return reply.status(404).send({ error: 'Draft has not started' });
    }

    if (draft.status === 'paused') {
      return reply.status(400).send({ error: 'Draft is paused' });
    }

    if (draft.status === 'completed') {
      return reply.status(400).send({ error: 'Draft is completed' });
    }

    const tournament = await ensureTournamentExists(tournamentId);

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const player = await Player.findOne({
      _id: playerId,
      ...buildGlobalPlayerQuery(tournament),
    }).lean();

    if (!player) {
      return reply.status(400).send({ error: 'Player must belong to this tournament' });
    }

    const teamAIds = draft.teamAPlayerIds.map((id) => id.toString());
    const teamBIds = draft.teamBPlayerIds.map((id) => id.toString());

    if (teamAIds.includes(playerId) || teamBIds.includes(playerId)) {
      return reply.status(400).send({ error: 'Player has already been picked' });
    }

    if (draft.currentTurn === 'A') {
      draft.teamAPlayerIds.push(playerId);
      draft.currentTurn = 'B';
    } else {
      draft.teamBPlayerIds.push(playerId);
      draft.currentTurn = 'A';
    }

    const pickedCount = draft.teamAPlayerIds.length + draft.teamBPlayerIds.length;
    const totalPlayers = await Player.countDocuments(buildGlobalPlayerQuery(tournament));

    if (pickedCount >= totalPlayers) {
      draft.status = 'completed';
    }

    await draft.save();

    const populatedDraft = await findDraft(tournamentId);
    const response = buildDraftResponse(populatedDraft);
    emitDraftEvent(request, tournamentId, response);

    return reply.send(response);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to pick player' });
  }
};

export const pauseDraft = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const draft = await DraftSession.findOneAndUpdate(
      { tournamentId, status: { $ne: 'completed' } },
      { status: 'paused' },
      { new: true }
    )
      .populate('captainAPlayerId')
      .populate('captainBPlayerId')
      .populate('teamAPlayerIds')
      .populate('teamBPlayerIds');

    if (!draft) {
      return reply.status(404).send({ error: 'Active draft not found' });
    }

    const response = buildDraftResponse(draft);
    emitDraftEvent(request, tournamentId, response);

    return reply.send(response);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to pause draft' });
  }
};

export const resumeDraft = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const draft = await DraftSession.findOneAndUpdate(
      { tournamentId, status: 'paused' },
      { status: 'active' },
      { new: true }
    )
      .populate('captainAPlayerId')
      .populate('captainBPlayerId')
      .populate('teamAPlayerIds')
      .populate('teamBPlayerIds');

    if (!draft) {
      return reply.status(404).send({ error: 'Paused draft not found' });
    }

    const response = buildDraftResponse(draft);
    emitDraftEvent(request, tournamentId, response);

    return reply.send(response);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to resume draft' });
  }
};
