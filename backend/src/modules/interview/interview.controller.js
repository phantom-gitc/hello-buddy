const interviewService = require('./interview.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const interviewController = {
  createInterview: asyncHandler(async (req, res) => {
    const interview = await interviewService.createInterview(req.user._id, req.body);
    return res.status(201).json(new ApiResponse(201, interview, 'Interview plan generated and ready'));
  }),

  getInterviews: asyncHandler(async (req, res) => {
    const interviews = await interviewService.getInterviews(req.user._id);
    return res.status(200).json(new ApiResponse(200, interviews, 'Interviews retrieved successfully'));
  }),

  getInterviewById: asyncHandler(async (req, res) => {
    const interview = await interviewService.getInterviewById(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, interview, 'Interview retrieved successfully'));
  }),

  startInterview: asyncHandler(async (req, res) => {
    const session = await interviewService.startInterview(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, session, 'Interview started'));
  }),

  submitAnswer: asyncHandler(async (req, res) => {
    const result = await interviewService.submitAnswer(req.user._id, req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, result, 'Answer evaluated successfully'));
  }),

  completeInterview: asyncHandler(async (req, res) => {
    const interview = await interviewService.completeInterview(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, interview, 'Interview completed'));
  }),

  getReport: asyncHandler(async (req, res) => {
    const report = await interviewService.getReport(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, report, 'Interview report retrieved successfully'));
  }),
};

module.exports = interviewController;
