const mongoose = require('mongoose');

const skillScoreSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  score: { type: Number, default: 0 },
  assessmentsCount: { type: Number, default: 0 },
});

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    interviewsCompleted: {
      type: Number,
      default: 0,
    },
    averageInterviewScore: {
      type: Number,
      default: 0,
    },
    learningSessionsCompleted: {
      type: Number,
      default: 0,
    },
    averageLearningScore: {
      type: Number,
      default: 0,
    },
    skillScores: [skillScoreSchema],
    identifiedWeakAreas: [
      {
        topic: String,
        frequency: { type: Number, default: 1 },
        lastIdentifiedAt: { type: Date, default: Date.now },
      },
    ],
    identifiedStrengths: [String],
    readinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
