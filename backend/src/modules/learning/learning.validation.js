const { z } = require('zod');
const { DIFFICULTY_LEVELS_LIST } = require('../../constants/difficulty');

const createSessionSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  role: z.string().min(1, 'Role is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(DIFFICULTY_LEVELS_LIST).default('intermediate'),
});

const postMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

const submitAnswerSchema = z.object({
  answer: z.string().min(1, 'Answer cannot be empty'),
});

const sessionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
});

module.exports = {
  createSessionSchema,
  postMessageSchema,
  submitAnswerSchema,
  sessionIdParamSchema,
};
