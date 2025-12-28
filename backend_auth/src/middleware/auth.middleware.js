const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'No token provided' });
	}

	const token = authHeader.split(' ')[1];
	try {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			console.error('JWT_SECRET is not defined');
			return res.status(500).json({ message: 'Server misconfiguration' });
		}
		const decoded = jwt.verify(token, secret);
		console.log('Dữ liệu giải mã từ Token:', decoded);
		req.userId = decoded.sub || decoded.id || decoded.userId || decoded._id;
		if (!req.userId) {
			return res.status(401).json({ message: 'Invalid token payload' });
		}
		return next();
	} catch (err) {
		console.error('JWT verification failed:', err.message || err);
		return res.status(403).json({ message: 'Invalid or expired token' });
	}
}

module.exports = authMiddleware;

