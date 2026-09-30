const { z } = require('zod');
const { INTERVIEW_TYPES_LIST } = require('../../constants/interviewTypes');
const { DIFFICULTY_LEVELS_LIST } = require('../../constants/difficulty');

const createInterviewSchema = z.object({
  role: z.string().min(1, 'Target role is required'),
  experienceYears: z.number().min(0).max(50).default(0),
  targetSalary: z.string().optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS_LIST).default('intermediate'),
  interviewType: z.enum(INTERVIEW_TYPES_LIST).default('technical'),
  durationMinutes: z.number().min(10).max(120).default(30),
  topics: z.array(z.string()).optional().default([]),
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
});

const submitAnswerSchema = z.object({
  answer: z.string().min(1, 'Answer text is required').max(10000),
});

const interviewIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID'),
});

module.exports = {
  createInterviewSchema,
  submitAnswerSchema,
  interviewIdParamSchema,
};
