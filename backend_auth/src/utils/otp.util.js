function generateOtp(length = 6) {
	const digits = '0123456789';
	let result = '';
	for (let i = 0; i < length; i += 1) {
		result += digits[Math.floor(Math.random() * digits.length)];
	}
	return result;
}

module.exports = { generateOtp };


