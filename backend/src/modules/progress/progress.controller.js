const progressService = require('./progress.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const progressController = {
  getProgress: asyncHandler(async (req, res) => {
    const progress = await progressService.getUserProgress(req.user._id);
    return res.status(200).json(new ApiResponse(200, progress, 'User progress retrieved'));
  }),

  syncProgress: asyncHandler(async (req, res) => {
    const progress = await progressService.syncUserProgress(req.user._id);
    return res.status(200).json(new ApiResponse(200, progress, 'User progress synchronized'));
  }),
};

module.exports = progressController;
