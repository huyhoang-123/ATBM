const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getProfile } = require('../controllers/profile.controller');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);

module.exports = router;
