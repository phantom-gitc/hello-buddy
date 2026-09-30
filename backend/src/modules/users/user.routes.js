const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const validate = require('../../middleware/validation.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { updateProfileSchema, updatePreferencesSchema } = require('./user.validation');

router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), userController.updateMe);
router.patch('/me/preferences', validate({ body: updatePreferencesSchema }), userController.updatePreferences);
router.delete('/me', userController.deleteMe);

module.exports = router;
