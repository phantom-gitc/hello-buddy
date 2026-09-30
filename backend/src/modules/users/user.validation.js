const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  careerGoal: z.string().max(200).optional(),
  targetRole: z.string().max(100).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  targetSalary: z.string().max(50).optional(),
  skills: z.array(z.string()).optional(),
  preferredDomains: z.array(z.string()).optional(),
});

const updatePreferencesSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  pace: z.enum(['slow', 'moderate', 'fast']).optional(),
  topicsOfInterest: z.array(z.string()).optional(),
});

module.exports = {
  updateProfileSchema,
  updatePreferencesSchema,
};
