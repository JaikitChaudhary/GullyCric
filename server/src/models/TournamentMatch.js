import mongoose from 'mongoose';

const tournamentMatchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    teamAId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamBId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    result: {
      type: String,
      enum: ['teamA', 'teamB', 'tie'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    versionKey: false,
  }
);

const TournamentMatch = mongoose.model('TournamentMatch', tournamentMatchSchema);

export default TournamentMatch;
