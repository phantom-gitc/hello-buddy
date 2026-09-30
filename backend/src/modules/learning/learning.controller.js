const learningService = require('./learning.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const learningController = {
  getDomains: asyncHandler(async (req, res) => {
    const domains = learningService.getDomains();
    return res.status(200).json(new ApiResponse(200, domains, 'Domains retrieved'));
  }),

  getTopics: asyncHandler(async (req, res) => {
    const topics = learningService.getTopics(req.query.domain);
    return res.status(200).json(new ApiResponse(200, topics, 'Topics retrieved'));
  }),

  createSession: asyncHandler(async (req, res) => {
    const session = await learningService.createSession(req.user._id, req.body);
    return res.status(201).json(new ApiResponse(201, session, 'Learning session started'));
  }),

  getSessions: asyncHandler(async (req, res) => {
    const sessions = await learningService.getSessions(req.user._id);
    return res.status(200).json(new ApiResponse(200, sessions, 'Learning sessions retrieved'));
  }),

  getSessionById: asyncHandler(async (req, res) => {
    const session = await learningService.getSessionById(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, session, 'Learning session retrieved'));
  }),

  postMessage: asyncHandler(async (req, res) => {
    const result = await learningService.postMessage(req.user._id, req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, result, 'Message processed'));
  }),

  submitAnswer: asyncHandler(async (req, res) => {
    const result = await learningService.submitAnswer(req.user._id, req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, result, 'Answer evaluated'));
  }),

  getProgress: asyncHandler(async (req, res) => {
    const progress = await learningService.getProgress(req.user._id);
    return res.status(200).json(new ApiResponse(200, progress, 'Learning progress retrieved'));
  }),
};

module.exports = learningController;
