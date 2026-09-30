const express = require('express');
const router = express.Router();
const learningController = require('./learning.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { aiLimiter } = require('../../middleware/rateLimit.middleware');
const validate = require('../../middleware/validation.middleware');
const {
  createSessionSchema,
  postMessageSchema,
  submitAnswerSchema,
  sessionIdParamSchema,
} = require('./learning.validation');

router.use(requireAuth);

router.get('/domains', learningController.getDomains);
router.get('/topics', learningController.getTopics);
router.get('/progress', learningController.getProgress);

router.post('/sessions', aiLimiter, validate({ body: createSessionSchema }), learningController.createSession);
router.get('/sessions', learningController.getSessions);
router.get('/sessions/:id', validate({ params: sessionIdParamSchema }), learningController.getSessionById);

router.post('/sessions/:id/message', aiLimiter, validate({ params: sessionIdParamSchema, body: postMessageSchema }), learningController.postMessage);
router.post('/sessions/:id/answer', aiLimiter, validate({ params: sessionIdParamSchema, body: submitAnswerSchema }), learningController.submitAnswer);

module.exports = router;
