const userService = require('./user.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const userController = {
  getMe: asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req.user._id);
    return res.status(200).json(new ApiResponse(200, profile, 'User profile retrieved'));
  }),

  updateMe: asyncHandler(async (req, res) => {
    const updated = await userService.updateProfile(req.user._id, req.body);
    return res.status(200).json(new ApiResponse(200, updated, 'User profile updated successfully'));
  }),

  updatePreferences: asyncHandler(async (req, res) => {
    const preferences = await userService.updatePreferences(req.user._id, req.body);
    return res.status(200).json(new ApiResponse(200, preferences, 'Learning preferences updated successfully'));
  }),

  deleteMe: asyncHandler(async (req, res) => {
    const result = await userService.deleteAccount(req.user._id);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json(new ApiResponse(200, result, 'Account deactivated successfully'));
  }),
};

module.exports = userController;
