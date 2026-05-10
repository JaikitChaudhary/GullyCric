import { createMatch, getMatch, setToss, addRun, addWide, addWicket, undoAction, deleteMatch } from '../controllers/matchController.js';

const matchRoutes = async (fastify) => {
  fastify.post('/', createMatch);
  fastify.post('/toss/:code', setToss);
  fastify.post('/:code/toss', setToss);
  fastify.get('/:code', getMatch);
  fastify.post('/:code/run', addRun);
  fastify.post('/:code/wide', addWide);
  fastify.post('/:code/wicket', addWicket);
  fastify.post('/:code/undo', undoAction);
  fastify.delete('/:code', deleteMatch);
};

export default matchRoutes;
