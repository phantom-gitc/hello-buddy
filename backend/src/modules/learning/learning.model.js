const mongoose = require('mongoose');
const { DIFFICULTY_LEVELS } = require('../../constants/difficulty');

const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['EXPLANATION', 'QUESTION', 'ANSWER', 'FEEDBACK'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  evaluation: {
    score: Number,
    isUnderstood: Boolean,
    feedback: String,
    identifiedWeaknesses: [String],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const learningSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVELS),
      default: DIFFICULTY_LEVELS.INTERMEDIATE,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
    currentConceptIndex: {
      type: Number,
      default: 0,
    },
    currentQuestion: {
      type: String,
      default: '',
    },
    weakAreasIdentified: {
      type: [String],
      default: [],
    },
    masteryScore: {
      type: Number,
      default: 0,
    },
    interactions: [interactionSchema],
  },
  {
    timestamps: true,
  }
);

learningSessionSchema.index({ userId: 1, createdAt: -1 });

const LearningSession = mongoose.model('LearningSession', learningSessionSchema);

module.exports = LearningSession;
