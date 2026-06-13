import Tournament from '../models/Tournament.js';

const buildTournamentResponse = (tournament) => {
  const serializedTournament = tournament?.toObject ? tournament.toObject() : { ...tournament };

  return {
    id: serializedTournament.id || serializedTournament._id?.toString(),
    name: serializedTournament.name,
    logo: serializedTournament.logo || '',
    startDate: serializedTournament.startDate,
    overs: serializedTournament.overs,
    createdBy: serializedTournament.createdBy,
    createdAt: serializedTournament.createdAt,
  };
};

export const createTournament = async (request, reply) => {
  try {
    const { name, logo, startDate, overs, createdBy } = request.body || {};
    const sanitizedName = name?.trim();
    const sanitizedLogo = logo?.trim() || '';
    const sanitizedCreatedBy = createdBy?.trim();
    const parsedOvers = Number(overs);
    const parsedStartDate = new Date(startDate);

    if (!sanitizedName) {
      return reply.status(400).send({ error: 'Tournament name is required' });
    }

    if (!Number.isInteger(parsedOvers) || parsedOvers < 1) {
      return reply.status(400).send({ error: 'Valid overs are required' });
    }

    if (!startDate || Number.isNaN(parsedStartDate.getTime())) {
      return reply.status(400).send({ error: 'Valid start date is required' });
    }

    if (!sanitizedCreatedBy) {
      return reply.status(400).send({ error: 'createdBy is required' });
    }

    const tournament = await Tournament.create({
      name: sanitizedName,
      logo: sanitizedLogo,
      startDate: parsedStartDate,
      overs: parsedOvers,
      createdBy: sanitizedCreatedBy,
    });

    return reply.status(201).send(buildTournamentResponse(tournament));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create tournament' });
  }
};

export const listTournaments = async (request, reply) => {
  try {
    const createdBy = request.query.createdBy?.trim();

    if (!createdBy) {
      return reply.status(400).send({ error: 'createdBy is required' });
    }

    const tournaments = await Tournament.find({ createdBy })
      .sort({ createdAt: -1 })
      .limit(50);

    return reply.send(tournaments.map((tournament) => buildTournamentResponse(tournament)));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch tournaments' });
  }
};

export const getTournament = async (request, reply) => {
  try {
    const { id } = request.params;
    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    return reply.send(buildTournamentResponse(tournament));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch tournament' });
  }
};
