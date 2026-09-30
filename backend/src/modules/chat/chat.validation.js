const { z } = require('zod');

const createChatSchema = z.object({
  title: z.string().max(100).optional(),
  topic: z.string().max(100).optional(),
  includeResumeContext: z.boolean().optional(),
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000),
  stream: z.boolean().optional().default(false),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string(),
        name: z.string(),
        fileType: z.enum(['image', 'pdf', 'audio', 'doc']),
        size: z.number(),
      })
    )
    .optional(),
});

const chatIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
});

module.exports = {
  createChatSchema,
  sendMessageSchema,
  chatIdParamSchema,
};
