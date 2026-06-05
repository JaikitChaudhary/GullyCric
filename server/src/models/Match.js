import mongoose from 'mongoose';
import { formatOversFromBalls, getBallsLimit } from '../services/scoringService.js';

const historySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['run', 'wicket', 'wide', 'WD'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    runs: {
      type: Number,
      min: 0,
    },
    isBall: {
      type: Boolean,
    },
  },
  {
    _id: false,
  }
);

const previousInningsStateSchema = new mongoose.Schema(
  {
    innings: {
      type: Number,
      enum: [1],
      required: true,
    },
    totalRuns: {
      type: Number,
      required: true,
      min: 0,
    },
    wickets: {
      type: Number,
      required: true,
      min: 0,
    },
    balls: {
      type: Number,
      required: true,
      min: 0,
    },
    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const matchSchema = new mongoose.Schema(
  {
    teamAName: {
      type: String,
      trim: true,
      default: 'Team 1',
    },
    teamBName: {
      type: String,
      trim: true,
      default: 'Team 2',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tossWinner: {
      type: String,
      trim: true,
      default: null,
    },
    decision: {
      type: String,
      enum: ['bat', 'bowl', null],
      default: null,
    },
    battingTeam: {
      type: String,
      trim: true,
      default: null,
    },
    bowlingTeam: {
      type: String,
      trim: true,
      default: null,
    },
    matchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    ownerToken: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    deviceId: {
      type: String,
      trim: true,
      index: true,
    },
    maxOvers: {
      type: Number,
      required: true,
      min: 1,
    },
    totalRuns: {
      type: Number,
      default: 0,
      min: 0,
    },
    wickets: {
      type: Number,
      default: 0,
      min: 0,
    },
    balls: {
      type: Number,
      default: 0,
      min: 0,
    },
    innings: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    firstInningsScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    target: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    undoCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    result: {
      type: String,
      default: '',
      trim: true,
    },
    previousInningsState: {
      type: previousInningsStateSchema,
      default: null,
    },
    history: {
      type: [historySchema],
      default: [],
    },
    scoringEventIds: {
      type: [String],
      default: [],
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

matchSchema.virtual('currentOver').get(function getCurrentOver() {
  return formatOversFromBalls(this.balls);
});

matchSchema.virtual('ballsLimit').get(function getBallsLimitVirtual() {
  return getBallsLimit(this.maxOvers);
});

matchSchema.virtual('overs').get(function getOvers() {
  return this.currentOver;
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
