const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	passwordHash: {
		type: String,
		required: true,
	},
	isEmailVerified: {
		type: Boolean,
		default: false,
	},
	otp: {
		code: { type: String },
		expiresAt: { type: Date },
		purpose: { type: String, enum: ['register', 'login', 'verify'], default: 'verify' },
	},
	completedLessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  ]
}, {
	timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

