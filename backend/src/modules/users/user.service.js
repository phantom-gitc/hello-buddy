const User = require('./user.model');
const ApiError = require('../../utils/ApiError');

const userService = {
  /**
   * Retrieves profile of current user
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  },

  /**
   * Updates basic and career profile information
   */
  async updateProfile(userId, updateData) {
    // Only allow updating safe fields
    const allowedFields = [
      'name',
      'careerGoal',
      'targetRole',
      'experienceYears',
      'targetSalary',
      'skills',
      'preferredDomains',
    ];

    const safeUpdate = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: safeUpdate }, { new: true, runValidators: true }).select(
      '-password'
    );

    if (!updatedUser) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return updatedUser;
  },

  /**
   * Updates learning preferences
   */
  async updatePreferences(userId, preferences) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    user.learningPreferences = {
      ...user.learningPreferences,
      ...preferences,
    };

    await user.save();
    return user.learningPreferences;
  },

  /**
   * Soft deletes or deactivates user account
   */
  async deleteAccount(userId) {
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return { message: 'Account deactivated successfully' };
  },
};

module.exports = userService;
