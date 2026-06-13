import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    captainPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    playerIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Player',
      default: [],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
  }
);

const Team = mongoose.model('Team', teamSchema);

export default Team;
