const express = require('express');
const router = express.Router();
const resumeController = require('./resume.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { uploadResume } = require('../../middleware/upload.middleware');
const { uploadLimiter, aiLimiter } = require('../../middleware/rateLimit.middleware');
const validate = require('../../middleware/validation.middleware');
const { resumeIdParamSchema } = require('./resume.validation');

router.use(requireAuth);

router.post('/', uploadLimiter, uploadResume, resumeController.uploadResume);
router.get('/', resumeController.getResumes);
router.get('/:id', validate({ params: resumeIdParamSchema }), resumeController.getResumeById);
router.post('/:id/analyze', aiLimiter, validate({ params: resumeIdParamSchema }), resumeController.analyzeResume);
router.get('/:id/analysis', validate({ params: resumeIdParamSchema }), resumeController.getResumeAnalysis);
router.delete('/:id', validate({ params: resumeIdParamSchema }), resumeController.deleteResume);

module.exports = router;
