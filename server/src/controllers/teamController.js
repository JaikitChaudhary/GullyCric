import mongoose from 'mongoose';
import Player from '../models/Player.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';

const buildPlayerSummary = (player) => {
  if (!player) {
    return null;
  }

  return {
    id: player.id || player._id?.toString(),
    name: player.name,
    nickName: player.nickName || '',
    mobile: player.mobile,
  };
};

const buildTeamResponse = (team) => {
  const serializedTeam = team?.toObject ? team.toObject() : { ...team };
  const playerIds = Array.isArray(serializedTeam.playerIds) ? serializedTeam.playerIds : [];

  return {
    id: serializedTeam.id || serializedTeam._id?.toString(),
    tournamentId: serializedTeam.tournamentId?.toString(),
    teamName: serializedTeam.teamName,
    captainPlayerId: serializedTeam.captainPlayerId?._id?.toString() || serializedTeam.captainPlayerId?.toString(),
    playerIds: playerIds.map((player) => player?._id?.toString() || player?.toString()),
    captain: buildPlayerSummary(serializedTeam.captainPlayerId?._id ? serializedTeam.captainPlayerId : null),
    players: playerIds
      .filter((player) => player?._id)
      .map((player) => buildPlayerSummary(player)),
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

const normalizePlayerIds = (playerIds, captainPlayerId) => {
  const ids = Array.isArray(playerIds) ? playerIds : [];
  const allIds = [...ids, captainPlayerId]
    .map((playerId) => (typeof playerId === 'string' ? playerId.trim() : ''))
    .filter(Boolean);

  return [...new Set(allIds)];
};

const validateTeamPayload = async ({ tournamentId, teamName, captainPlayerId, playerIds, teamId }) => {
  const sanitizedTeamName = teamName?.trim();
  const sanitizedCaptainPlayerId = captainPlayerId?.trim();
  const normalizedPlayerIds = normalizePlayerIds(playerIds, sanitizedCaptainPlayerId);

  if (!sanitizedTeamName) {
    return { error: 'Team name is required' };
  }

  if (!sanitizedCaptainPlayerId || !mongoose.isValidObjectId(sanitizedCaptainPlayerId)) {
    return { error: 'Captain is required' };
  }

  if (normalizedPlayerIds.length === 0 || normalizedPlayerIds.some((playerId) => !mongoose.isValidObjectId(playerId))) {
    return { error: 'Select valid players for the team' };
  }

  const tournament = await Tournament.findById(tournamentId).lean();

  if (!tournament) {
    return { error: 'Tournament not found' };
  }

  const players = await Player.find({
    _id: { $in: normalizedPlayerIds },
    ...buildGlobalPlayerQuery(tournament),
  }).lean();

  if (players.length !== normalizedPlayerIds.length) {
    return { error: 'All selected players must belong to this tournament' };
  }

  const captainBelongsToTournament = players.some((player) => player._id.toString() === sanitizedCaptainPlayerId);

  if (!captainBelongsToTournament) {
    return { error: 'Captain must be selected from tournament players' };
  }

  const teamQuery = {
    tournamentId,
    playerIds: { $in: normalizedPlayerIds },
  };

  if (teamId) {
    teamQuery._id = { $ne: teamId };
  }

  const conflictingTeam = await Team.findOne(teamQuery).populate('playerIds').lean();

  if (conflictingTeam) {
    const selectedIdSet = new Set(normalizedPlayerIds);
    const conflictingPlayer = conflictingTeam.playerIds.find((player) => selectedIdSet.has(player._id.toString()));
    const playerName = conflictingPlayer?.name || 'Selected player';

    return { error: `${playerName} already belongs to another team in this tournament` };
  }

  return {
    team: {
      teamName: sanitizedTeamName,
      captainPlayerId: sanitizedCaptainPlayerId,
      playerIds: normalizedPlayerIds,
    },
  };
};

export const listTeams = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const teams = await Team.find({ tournamentId })
      .sort({ teamName: 1 })
      .populate('captainPlayerId')
      .populate('playerIds')
      .lean();

    return reply.send(teams.map((team) => buildTeamResponse(team)));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch teams' });
  }
};

export const createTeam = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const validation = await validateTeamPayload({
      tournamentId,
      teamName: request.body?.teamName,
      captainPlayerId: request.body?.captainPlayerId,
      playerIds: request.body?.playerIds,
    });

    if (validation.error) {
      return reply.status(400).send({ error: validation.error });
    }

    const team = await Team.create({
      tournamentId,
      ...validation.team,
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('captainPlayerId')
      .populate('playerIds');

    return reply.status(201).send(buildTeamResponse(populatedTeam));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create team' });
  }
};

export const getTeam = async (request, reply) => {
  try {
    const { id: tournamentId, teamId } = request.params;

    if (!mongoose.isValidObjectId(tournamentId) || !mongoose.isValidObjectId(teamId)) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    const team = await Team.findOne({ _id: teamId, tournamentId })
      .populate('captainPlayerId')
      .populate('playerIds')
      .lean();

    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    return reply.send(buildTeamResponse(team));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch team' });
  }
};

export const updateTeam = async (request, reply) => {
  try {
    const { id: tournamentId, teamId } = request.params;

    if (!mongoose.isValidObjectId(tournamentId) || !mongoose.isValidObjectId(teamId)) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    const existingTeam = await Team.exists({ _id: teamId, tournamentId });

    if (!existingTeam) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    const validation = await validateTeamPayload({
      tournamentId,
      teamId,
      teamName: request.body?.teamName,
      captainPlayerId: request.body?.captainPlayerId,
      playerIds: request.body?.playerIds,
    });

    if (validation.error) {
      return reply.status(400).send({ error: validation.error });
    }

    const team = await Team.findOneAndUpdate(
      { _id: teamId, tournamentId },
      validation.team,
      { new: true }
    )
      .populate('captainPlayerId')
      .populate('playerIds');

    return reply.send(buildTeamResponse(team));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update team' });
  }
};

export const deleteTeam = async (request, reply) => {
  try {
    const { id: tournamentId, teamId } = request.params;

    if (!mongoose.isValidObjectId(tournamentId) || !mongoose.isValidObjectId(teamId)) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    const team = await Team.findOneAndDelete({ _id: teamId, tournamentId });

    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete team' });
  }
};
