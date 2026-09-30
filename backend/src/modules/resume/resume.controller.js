const resumeService = require('./resume.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const resumeController = {
  uploadResume: asyncHandler(async (req, res) => {
    const resume = await resumeService.uploadResume(req.user._id, req.file);
    return res.status(201).json(new ApiResponse(201, resume, 'Resume uploaded successfully. Analysis in progress.'));
  }),

  getResumes: asyncHandler(async (req, res) => {
    const resumes = await resumeService.getResumes(req.user._id);
    return res.status(200).json(new ApiResponse(200, resumes, 'Resumes retrieved successfully'));
  }),

  getResumeById: asyncHandler(async (req, res) => {
    const resume = await resumeService.getResumeById(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, resume, 'Resume retrieved successfully'));
  }),

  getResumeAnalysis: asyncHandler(async (req, res) => {
    const analysis = await resumeService.getResumeAnalysis(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, analysis, 'Resume analysis retrieved successfully'));
  }),

  analyzeResume: asyncHandler(async (req, res) => {
    const result = await resumeService.triggerAnalysis(req.user._id, req.params.id);
    return res.status(202).json(new ApiResponse(202, result, result.message));
  }),

  deleteResume: asyncHandler(async (req, res) => {
    const result = await resumeService.deleteResume(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),
};

module.exports = resumeController;
