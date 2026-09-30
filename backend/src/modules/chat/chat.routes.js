const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { aiLimiter, uploadLimiter } = require('../../middleware/rateLimit.middleware');
const { uploadChatAttachment } = require('../../middleware/upload.middleware');
const validate = require('../../middleware/validation.middleware');
const { createChatSchema, sendMessageSchema, chatIdParamSchema } = require('./chat.validation');

router.use(requireAuth);

router.post('/', validate({ body: createChatSchema }), chatController.createChat);
router.get('/', chatController.getChats);
router.get('/:id', validate({ params: chatIdParamSchema }), chatController.getChatById);
router.delete('/:id', validate({ params: chatIdParamSchema }), chatController.deleteChat);

router.post('/:id/messages', aiLimiter, validate({ params: chatIdParamSchema, body: sendMessageSchema }), chatController.sendMessage);
router.get('/:id/messages', validate({ params: chatIdParamSchema }), chatController.getMessages);

router.post('/:id/attachments', uploadLimiter, validate({ params: chatIdParamSchema }), uploadChatAttachment, chatController.uploadAttachment);

module.exports = router;
