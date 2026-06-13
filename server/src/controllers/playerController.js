import mongoose from 'mongoose';
import Player from '../models/Player.js';
import Tournament from '../models/Tournament.js';

const buildPlayerResponse = (player) => {
  const serializedPlayer = player?.toObject ? player.toObject() : { ...player };

  return {
    id: serializedPlayer.id || serializedPlayer._id?.toString(),
    tournamentId: serializedPlayer.tournamentId?.toString(),
    name: serializedPlayer.name,
    mobile: serializedPlayer.mobile,
  };
};

const ensureTournamentExists = async (tournamentId) => {
  if (!mongoose.isValidObjectId(tournamentId)) {
    return false;
  }

  return Boolean(await Tournament.exists({ _id: tournamentId }));
};

export const listPlayers = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const query = request.query.q?.trim();

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const playerQuery = { tournamentId };

    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      playerQuery.$or = [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { mobile: { $regex: escapedQuery, $options: 'i' } },
      ];
    }

    const players = await Player.find(playerQuery)
      .sort({ name: 1 })
      .limit(200)
      .lean();

    return reply.send(players.map((player) => buildPlayerResponse(player)));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch players' });
  }
};

export const createPlayer = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const { name, mobile } = request.body || {};
    const sanitizedName = name?.trim();
    const sanitizedMobile = mobile?.trim();

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (!sanitizedName || !sanitizedMobile) {
      return reply.status(400).send({ error: 'Player name and mobile are required' });
    }

    const player = await Player.create({
      tournamentId,
      name: sanitizedName,
      mobile: sanitizedMobile,
    });

    return reply.status(201).send(buildPlayerResponse(player));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create player' });
  }
};

export const getPlayer = async (request, reply) => {
  try {
    const { id: tournamentId, playerId } = request.params;

    if (!mongoose.isValidObjectId(tournamentId) || !mongoose.isValidObjectId(playerId)) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    const player = await Player.findOne({ _id: playerId, tournamentId }).lean();

    if (!player) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    return reply.send(buildPlayerResponse(player));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch player' });
  }
};

export const updatePlayer = async (request, reply) => {
  try {
    const { id: tournamentId, playerId } = request.params;
    const { name, mobile } = request.body || {};
    const sanitizedName = name?.trim();
    const sanitizedMobile = mobile?.trim();

    if (!mongoose.isValidObjectId(tournamentId) || !mongoose.isValidObjectId(playerId)) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    if (!sanitizedName || !sanitizedMobile) {
      return reply.status(400).send({ error: 'Player name and mobile are required' });
    }

    const player = await Player.findOneAndUpdate(
      { _id: playerId, tournamentId },
      { name: sanitizedName, mobile: sanitizedMobile },
      { new: true }
    );

    if (!player) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    return reply.send(buildPlayerResponse(player));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update player' });
  }
};
