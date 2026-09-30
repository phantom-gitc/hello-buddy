const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      default: 'pdf',
    },
    extractedText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['UPLOADED', 'PARSING', 'PARSED', 'ANALYZING', 'ANALYZED', 'FAILED'],
      default: 'UPLOADED',
      index: true,
    },
    parsedData: {
      score: { type: Number, default: 0 },
      detectedRole: { type: String, default: '' },
      summary: { type: String, default: '' },
      skills: {
        technical: { type: [String], default: [] },
        soft: { type: [String], default: [] },
        tools: { type: [String], default: [] },
      },
      experienceSummary: { type: String, default: '' },
      projects: [
        {
          title: String,
          technologies: [String],
          description: String,
        },
      ],
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      actionableImprovements: { type: [String], default: [] },
    },
    ingestedInQdrant: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user resumes sorted by time
resumeSchema.index({ userId: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
