
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendMail } = require('../utils/mailer');
const { generateOtp } = require('../utils/otp.util');

const validateEmail = (email) => {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(String(email).toLowerCase());
};

async function sendOtpAndPersist(user, purpose = 'verify') {
	const otp = generateOtp(6);
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
	user.otp = { code: otp, expiresAt, purpose };
	await user.save();

	await sendMail({
		to: user.email,
		subject: `Mã OTP (${purpose})`,
		text: `Mã OTP của bạn là: ${otp} (hết hạn sau 10 phút)`,
	});
}

async function register(req, res) {
	try {
		const { email, password } = req.body || {};
		if (Array.isArray(email) || Array.isArray(password)) {
			return res.status(400).json({ message: 'Invalid input types' });
		}

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		if (!validateEmail(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		if (typeof password !== 'string' || password.length < 6) {
			return res.status(400).json({ message: 'Password must be at least 6 characters' });
		}

		const normalizedEmail = String(email).toLowerCase().trim();

		let user = await User.findOne({ email: normalizedEmail });
		if (user && user.isEmailVerified) {
			return res.status(409).json({ message: 'Email already registered' });
		}

		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		if (!user) {
			user = new User({ email: normalizedEmail, passwordHash, isEmailVerified: false });
		} else {
			user.passwordHash = passwordHash;
			user.isEmailVerified = false;
		}

		await sendOtpAndPersist(user, 'register');

		return res.status(201).json({
			message: 'Đã gửi OTP tới email. Vui lòng xác thực để hoàn tất đăng ký.',
		});
	} catch (err) {
		console.error('Register error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body || {};
		if (Array.isArray(email) || Array.isArray(password)) {
			return res.status(400).json({ message: 'Invalid input types' });
		}

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		const normalizedEmail = String(email).toLowerCase().trim();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const match = await bcrypt.compare(password, user.passwordHash);
		if (!match) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		if (!user.isEmailVerified) {
			await sendOtpAndPersist(user, 'verify');
			return res.status(403).json({
				message: 'Email chưa xác thực. OTP đã được gửi lại.',
			});
		}

		await sendOtpAndPersist(user, 'login');

		return res.status(200).json({
			message: 'Đã gửi OTP đăng nhập tới email. Vui lòng xác thực.',
		});
	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}


async function changePassword(req, res) {
	try {
		const userId = req.userId;
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });

		const { currentPassword, newPassword } = req.body || {};
		if (Array.isArray(currentPassword) || Array.isArray(newPassword)) {
			return res.status(400).json({ message: 'Invalid input types' });
		}

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: 'Current and new passwords are required' });
		}

		if (typeof newPassword !== 'string' || newPassword.length < 6) {
			return res.status(400).json({ message: 'New password must be at least 6 characters' });
		}

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: 'User not found' });

		const match = await bcrypt.compare(currentPassword, user.passwordHash);
		if (!match) {
			return res.status(401).json({ message: 'Current password is incorrect' });
		}

		if (currentPassword === newPassword) {
			return res.status(400).json({ message: 'New password must be different from current password' });
		}

		const saltRounds = 10;
		user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
		await user.save();

		return res.status(200).json({ message: 'Password updated' });
	} catch (err) {
		console.error('Change password error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

async function verifyOtp(req, res) {
	try {
		const { email, otp } = req.body || {};
		if (!email || !otp) {
			return res.status(400).json({ message: 'Email và OTP là bắt buộc' });
		}

		const normalizedEmail = String(email).toLowerCase().trim();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user || !user.otp || !user.otp.code) {
			return res.status(400).json({ message: 'OTP không hợp lệ' });
		}

		if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
			user.otp = undefined;
			await user.save();
			return res.status(400).json({ message: 'OTP đã hết hạn, vui lòng yêu cầu lại' });
		}

		if (user.otp.code !== otp) {
			return res.status(400).json({ message: 'OTP không đúng' });
		}

		if (user.otp.purpose === 'register' || user.otp.purpose === 'verify') {
			user.isEmailVerified = true;
		}

		user.otp = undefined;
		await user.save();

		const jwtSecret = process.env.JWT_SECRET;
		const token = jwt.sign(
			{ sub: user._id.toString(), email: user.email },
			jwtSecret,
			{ expiresIn: '1h' }
		);

		return res.status(200).json({
			message: 'Xác thực OTP thành công',
			token,
		});
	} catch (err) {
		console.error('Verify OTP error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { register, login, changePassword, verifyOtp };

