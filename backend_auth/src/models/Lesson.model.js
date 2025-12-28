const mongoose = require('mongoose');

// Schema cho exercise data - flexible để hỗ trợ các loại khác nhau
const exerciseDataSchema = new mongoose.Schema({}, { strict: false });

// Schema cho exercise
const exerciseSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: ['matchWords', 'chooseTranslation', 'typingQuiz', 'wordOrder'],
	},
	instruction: {
		type: String,
		required: true,
	},
	order: {
		type: Number,
		required: true,
	},
	data: {
		type: mongoose.Schema.Types.Mixed,
		required: true,
	},
}, { _id: false });

// Schema cho lesson
const lessonSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	exercises: {
		type: [exerciseSchema],
		required: true,
		default: [],
	},
}, {
	timestamps: true,
});

// Index để tìm kiếm nhanh hơn
lessonSchema.index({ title: 1 });
lessonSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lesson', lessonSchema);



