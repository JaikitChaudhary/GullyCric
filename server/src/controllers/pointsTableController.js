import mongoose from 'mongoose';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import TournamentMatch from '../models/TournamentMatch.js';

const ensureTournamentExists = async (tournamentId) => {
  if (!mongoose.isValidObjectId(tournamentId)) {
    return false;
  }

  return Boolean(await Tournament.exists({ _id: tournamentId }));
};

const buildEmptyRow = (team) => ({
  teamId: team._id.toString(),
  teamName: team.teamName,
  played: 0,
  won: 0,
  lost: 0,
  tied: 0,
  points: 0,
});

const sortRows = (rows) =>
  rows.sort((first, second) => {
    if (second.points !== first.points) {
      return second.points - first.points;
    }

    if (second.won !== first.won) {
      return second.won - first.won;
    }

    return first.teamName.localeCompare(second.teamName);
  });

export const getPointsTable = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const [teams, matches] = await Promise.all([
      Team.find({ tournamentId }).sort({ teamName: 1 }).lean(),
      TournamentMatch.find({ tournamentId }).lean(),
    ]);

    const tableByTeamId = new Map(teams.map((team) => [team._id.toString(), buildEmptyRow(team)]));

    matches.forEach((match) => {
      const teamAId = match.teamAId.toString();
      const teamBId = match.teamBId.toString();
      const teamA = tableByTeamId.get(teamAId);
      const teamB = tableByTeamId.get(teamBId);

      if (!teamA || !teamB) {
        return;
      }

      teamA.played += 1;
      teamB.played += 1;

      if (match.result === 'tie') {
        teamA.tied += 1;
        teamB.tied += 1;
        teamA.points += 1;
        teamB.points += 1;
        return;
      }

      if (match.result === 'teamA') {
        teamA.won += 1;
        teamB.lost += 1;
        teamA.points += 2;
        return;
      }

      teamB.won += 1;
      teamA.lost += 1;
      teamB.points += 2;
    });

    return reply.send(sortRows([...tableByTeamId.values()]));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch points table' });
  }
};

export const recordCompletedTournamentMatch = async (request, reply) => {
  try {
    const { id: tournamentId } = request.params;
    const { teamAId, teamBId, result } = request.body || {};

    if (!(await ensureTournamentExists(tournamentId))) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (!mongoose.isValidObjectId(teamAId) || !mongoose.isValidObjectId(teamBId) || teamAId === teamBId) {
      return reply.status(400).send({ error: 'Select two different teams' });
    }

    if (!['teamA', 'teamB', 'tie'].includes(result)) {
      return reply.status(400).send({ error: 'Select a valid match result' });
    }

    const selectedTeams = await Team.find({
      _id: { $in: [teamAId, teamBId] },
      tournamentId,
    }).lean();

    if (selectedTeams.length !== 2) {
      return reply.status(400).send({ error: 'Both teams must belong to this tournament' });
    }

    const tournamentMatch = await TournamentMatch.create({
      tournamentId,
      teamAId,
      teamBId,
      result,
    });

    return reply.status(201).send({
      id: tournamentMatch._id.toString(),
      tournamentId: tournamentMatch.tournamentId.toString(),
      teamAId: tournamentMatch.teamAId.toString(),
      teamBId: tournamentMatch.teamBId.toString(),
      result: tournamentMatch.result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to record tournament match' });
  }
};
