const nodemailer = require('nodemailer');

const {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS,
	SMTP_FROM,
} = process.env;

let transporter;

function getTransporter() {
	if (transporter) return transporter;

	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT) || 587,
		secure: false,
		auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
	});

	return transporter;
}

async function sendMail({ to, subject, text, html }) {
	if (!to) throw new Error('Missing "to" for email');

	const from = SMTP_FROM || SMTP_USER || 'no-reply@example.com';
	const transporterInstance = getTransporter();

	const mailOptions = { from, to, subject, text, html };

	// If transport is not fully configured, just log for development
	if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
		console.log('Email not sent (SMTP missing). Payload:', mailOptions);
		return { mocked: true };
	}

	return transporterInstance.sendMail(mailOptions);
}

module.exports = { sendMail };


