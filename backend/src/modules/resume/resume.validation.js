const { z } = require('zod');

const resumeIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format'),
});

module.exports = {
  resumeIdParamSchema,
};
