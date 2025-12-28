const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./src/config/db.config');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
	try {
		await connectDB();

		// Security middlewares
		app.use(helmet());
		app.use(cors());
		app.use(express.json({ limit: '10kb' }));
		// Use sanitize function directly to avoid assigning to read-only req properties
		app.use((req, res, next) => {
			try {
				if (req.body) mongoSanitize.sanitize(req.body);
				if (req.params) mongoSanitize.sanitize(req.params);
				if (req.headers) mongoSanitize.sanitize(req.headers);
				// don't reassign req.query directly because it may be a getter-only property
				if (req.query && typeof req.query === 'object') {
					mongoSanitize.sanitize(req.query);
				}
			} catch (err) {
				console.error('mongoSanitize error:', err);
			}
			next();
		});
		// Avoid using xss-clean middleware which reassigns req.query (can be read-only)
		app.use((req, res, next) => {
			try {
				const cleaner = xss && xss.clean ? xss.clean : null;
				if (cleaner) {
					// sanitize values in-place to avoid reassigning req properties
					if (req.body && typeof req.body === 'object') {
						Object.keys(req.body).forEach(k => { req.body[k] = cleaner(req.body[k]); });
					}
					if (req.params && typeof req.params === 'object') {
						Object.keys(req.params).forEach(k => { req.params[k] = cleaner(req.params[k]); });
					}
					if (req.headers && typeof req.headers === 'object') {
						Object.keys(req.headers).forEach(k => { req.headers[k] = cleaner(req.headers[k]); });
					}
					// query may be getter-only; mutate keys if it's a plain object
					if (req.query && typeof req.query === 'object') {
						Object.keys(req.query).forEach(k => {
							try { req.query[k] = cleaner(req.query[k]); } catch (e) { /* skip if read-only */ }
						});
					}
				}
			} catch (err) {
				console.error('xss-clean error:', err);
			}
			next();
		});

		// Basic rate limiting
		const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
		app.use(limiter);

		// Routes
		app.use('/api/auth', require('./src/routes/auth.routes'));
		app.use("/api/lessons", require('./src/routes/lesson.routes'));
		app.use('/api', require('./src/routes/profile.routes'));

		app.get('/', (req, res) => res.send('API running'));

		//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

		//https
		const https = require('https');
		const fs = require('fs');
		const path = require('path');
		
		const sslOptions = {
			key: fs.readFileSync(path.join(__dirname, './private.key')),
			cert: fs.readFileSync(path.join(__dirname, './server.crt'))
		};
		https.createServer(sslOptions, app).listen(8443, () => {
			console.log('HTTPS server running on https://localhost:8443');
		});
	} catch (err) {
		console.error('Failed to start server:', err);
		process.exit(1);
	}
}

start();

module.exports = app;
