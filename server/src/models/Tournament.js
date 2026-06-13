import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    overs: {
      type: Number,
      required: true,
      min: 1,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
