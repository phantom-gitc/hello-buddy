const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contextType: {
      type: String,
      enum: ['INTERVIEW', 'LEARNING', 'RESUME'],
      required: true,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    questionText: String,
    answerText: String,
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    metrics: {
      technicalAccuracy: Number,
      communicationClarity: Number,
      relevance: Number,
    },
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    idealAnswer: String,
    suggestedFollowUp: String,
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ userId: 1, contextType: 1, createdAt: -1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
