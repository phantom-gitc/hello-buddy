const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const resumeRoutes = require('../modules/resume/resume.routes');
const chatRoutes = require('../modules/chat/chat.routes');
const learningRoutes = require('../modules/learning/learning.routes');
const interviewRoutes = require('../modules/interview/interview.routes');
const progressRoutes = require('../modules/progress/progress.routes');
const uploadRoutes = require('../modules/uploads/upload.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/chats', chatRoutes);
router.use('/learning', learningRoutes);
router.use('/interviews', interviewRoutes);
router.use('/progress', progressRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
