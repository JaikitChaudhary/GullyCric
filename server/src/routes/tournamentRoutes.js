import { createTournament, getTournament, listTournaments } from '../controllers/tournamentController.js';
import { createPlayer, getPlayer, listPlayers, updatePlayer } from '../controllers/playerController.js';
import { createTeam, deleteTeam, getTeam, listTeams, updateTeam } from '../controllers/teamController.js';
import { getPointsTable, recordCompletedTournamentMatch } from '../controllers/pointsTableController.js';
import { getDraft, pauseDraft, pickDraftPlayer, resumeDraft, startDraft } from '../controllers/draftController.js';

const tournamentRoutes = async (fastify) => {
  fastify.get('/', listTournaments);
  fastify.post('/', createTournament);
  fastify.get('/:id/players', listPlayers);
  fastify.post('/:id/players', createPlayer);
  fastify.get('/:id/players/:playerId', getPlayer);
  fastify.put('/:id/players/:playerId', updatePlayer);
  fastify.get('/:id/teams', listTeams);
  fastify.post('/:id/teams', createTeam);
  fastify.get('/:id/teams/:teamId', getTeam);
  fastify.put('/:id/teams/:teamId', updateTeam);
  fastify.delete('/:id/teams/:teamId', deleteTeam);
  fastify.get('/:id/points-table', getPointsTable);
  fastify.post('/:id/tournament-matches', recordCompletedTournamentMatch);
  fastify.get('/:id/draft', getDraft);
  fastify.post('/:id/draft/start', startDraft);
  fastify.post('/:id/draft/pick', pickDraftPlayer);
  fastify.post('/:id/draft/pause', pauseDraft);
  fastify.post('/:id/draft/resume', resumeDraft);
  fastify.get('/:id', getTournament);
};

export default tournamentRoutes;
