import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
  }
);

const Player = mongoose.model('Player', playerSchema);

export default Player;
