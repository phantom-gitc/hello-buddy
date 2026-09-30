const mongoose = require('mongoose');
const { INTERVIEW_TYPES, INTERVIEW_STATUS } = require('../../constants/interviewTypes');
const { DIFFICULTY_LEVELS } = require('../../constants/difficulty');

const qaTurnSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  topic: { type: String, default: '' },
  question: { type: String, required: true },
  isFollowUp: { type: Boolean, default: false },
  answer: { type: String, default: '' },
  answeredAt: Date,
  evaluation: {
    score: Number,
    technicalAccuracy: Number,
    communicationClarity: Number,
    relevance: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    idealAnswer: String,
  },
});

const interviewReportSchema = new mongoose.Schema({
  overallScore: { type: Number, default: 0 },
  hiringRecommendation: {
    type: String,
    enum: ['STRONG_HIRE', 'HIRE', 'LEANING_HIRE', 'LEANING_NO_HIRE', 'NO_HIRE'],
    default: 'LEANING_HIRE',
  },
  summary: { type: String, default: '' },
  keyStrengths: [String],
  criticalWeaknesses: [String],
  detailedFeedback: {
    technicalProficiency: String,
    problemSolving: String,
    communication: String,
  },
  recommendedTopicsToStudy: [String],
  preparationRoadmap: [String],
  generatedAt: { type: Date, default: Date.now },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    role: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetSalary: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVELS),
      default: DIFFICULTY_LEVELS.INTERMEDIATE,
    },
    interviewType: {
      type: String,
      enum: Object.values(INTERVIEW_TYPES),
      default: INTERVIEW_TYPES.TECHNICAL,
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    topics: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(INTERVIEW_STATUS),
      default: INTERVIEW_STATUS.CREATED,
      index: true,
    },
    currentTurnIndex: {
      type: Number,
      default: 0,
    },
    turns: [qaTurnSchema],
    report: interviewReportSchema,
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for user interviews ordered by createdAt
interviewSchema.index({ userId: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
