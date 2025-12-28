const express = require('express');
const { register, login, changePassword } = require('../controllers/auth.controller');
const { verifyOtp } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const registerValidators = [
	check('email')
		.exists().withMessage('Email is required')
		.bail()
		.custom((v) => typeof v === 'string').withMessage('Email must be a string')
		.bail()
		.isEmail().withMessage('Invalid email')
		.normalizeEmail(),
	check('password')
		.exists().withMessage('Password is required')
		.bail()
		.isString().withMessage('Password must be a string')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidators = [
	check('email')
		.exists().withMessage('Email is required')
		.bail()
		.custom((v) => typeof v === 'string').withMessage('Email must be a string')
		.bail()
		.isEmail().withMessage('Invalid email')
		.normalizeEmail(),
	check('password')
		.exists().withMessage('Password is required')
		.bail()
		.custom((v) => typeof v === 'string').withMessage('Password must be a string'),
];

const changePasswordValidators = [
	check('currentPassword')
		.exists().withMessage('Current password is required')
		.bail()
		.custom((v) => typeof v === 'string').withMessage('Current password must be a string'),
	check('newPassword')
		.exists().withMessage('New password is required')
		.bail()
		.isString().withMessage('New password must be a string')
		.isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const otpValidators = [
	check('email')
		.exists().withMessage('Email is required')
		.bail()
		.custom((v) => typeof v === 'string').withMessage('Email must be a string')
		.bail()
		.isEmail().withMessage('Invalid email')
		.normalizeEmail(),
	check('otp')
		.exists().withMessage('OTP is required')
		.bail()
		.isLength({ min: 4, max: 10 }).withMessage('OTP length invalid'),
];

function runValidation(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	next();
}

router.post('/register', registerValidators, runValidation, register);
router.post('/login', loginValidators, runValidation, login);
router.post('/verify-otp', otpValidators, runValidation, verifyOtp);
router.post('/change-password', authMiddleware, changePasswordValidators, runValidation, changePassword);

module.exports = router;
