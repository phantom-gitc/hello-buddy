const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { getCookieOptions } = require('../../utils/jwt');

const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, result, 'Registration successful. Please check your email for the verification code.'));
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);

    if (result.tokens) {
      res.cookie('accessToken', result.tokens.accessToken, getCookieOptions(false));
      res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(true));
    }

    return res.status(200).json(new ApiResponse(200, result, 'Email verified successfully'));
  }),

  resendOtp: asyncHandler(async (req, res) => {
    const result = await authService.resendOtp(req.body);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);

    // Set HTTP-only secure cookies
    res.cookie('accessToken', result.tokens.accessToken, getCookieOptions(false));
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(true));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: result.user,
          tokens: result.tokens,
        },
        'Login successful'
      )
    );
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
    const userId = req.user?._id;

    const result = await authService.logout({
      userId,
      accessToken: token,
    });

    // Clear HTTP-only cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).json(new ApiResponse(200, result, 'Logout successful'));
  }),

  refresh: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refresh({ refreshToken });

    res.cookie('accessToken', result.tokens.accessToken, getCookieOptions(false));
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(true));

    return res.status(200).json(new ApiResponse(200, result, 'Token refreshed successfully'));
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword({
      userId: req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      ip: req.ip,
    });

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),

  getMe: asyncHandler(async (req, res) => {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: req.user,
        },
        'Current user retrieved'
      )
    );
  }),
};

module.exports = authController;
