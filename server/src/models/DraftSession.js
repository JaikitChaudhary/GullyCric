import mongoose from 'mongoose';

const draftSessionSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      unique: true,
      index: true,
    },
    captainAPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    captainBPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    teamAPlayerIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Player',
      default: [],
    },
    teamBPlayerIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Player',
      default: [],
    },
    currentTurn: {
      type: String,
      enum: ['A', 'B'],
      default: 'A',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
  }
);

const DraftSession = mongoose.model('DraftSession', draftSessionSchema);

export default DraftSession;
