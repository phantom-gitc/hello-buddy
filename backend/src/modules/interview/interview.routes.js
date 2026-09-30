const express = require('express');
const router = express.Router();
const interviewController = require('./interview.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { aiLimiter } = require('../../middleware/rateLimit.middleware');
const validate = require('../../middleware/validation.middleware');
const {
  createInterviewSchema,
  submitAnswerSchema,
  interviewIdParamSchema,
} = require('./interview.validation');

router.use(requireAuth);

router.post('/', aiLimiter, validate({ body: createInterviewSchema }), interviewController.createInterview);
router.get('/', interviewController.getInterviews);
router.get('/:id', validate({ params: interviewIdParamSchema }), interviewController.getInterviewById);

router.post('/:id/start', validate({ params: interviewIdParamSchema }), interviewController.startInterview);
router.post(
  '/:id/answer',
  aiLimiter,
  validate({ params: interviewIdParamSchema, body: submitAnswerSchema }),
  interviewController.submitAnswer
);
router.post('/:id/complete', validate({ params: interviewIdParamSchema }), interviewController.completeInterview);
router.get('/:id/report', validate({ params: interviewIdParamSchema }), interviewController.getReport);

module.exports = router;
