const express = require('express');
const router = express.Router();
const progressController = require('./progress.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', progressController.getProgress);
router.post('/sync', progressController.syncProgress);

module.exports = router;
