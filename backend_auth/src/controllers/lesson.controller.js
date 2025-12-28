const mongoose = require('mongoose');
const Lesson = require('../models/Lesson.model');
const User = require('../models/User.model');

// 1. Lấy tất cả lessons (Kèm trạng thái isCompleted)
const getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        let completedIds = [];
        
        if (req.userId) {
            const user = await User.findById(req.userId).select('completedLessons');
            if (user && user.completedLessons) {
                completedIds = user.completedLessons.map(id => id.toString());
            }
        }

        const dataWithStatus = lessons.map(lesson => ({
            ...lesson._doc,
            isCompleted: completedIds.includes(lesson._id.toString())
        }));

        return res.status(200).json({
            success: true,
            data: dataWithStatus,
            count: dataWithStatus.length,
        });
    } catch (error) {
        console.error('Error getting lessons:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message,
        });
    }
};

// 2. Đánh dấu bài học đã hoàn thành
const completeLesson = async (req, res) => {
    try {
        const { id } = req.params; // ID bài học lấy từ URL
        
        const userId = req.userId; 

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.',
            });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài học không hợp lệ',
            });
        }

        const lesson = await Lesson.findById(id).select('_id');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Bài học không tồn tại',
            });
        }

        const user = await User.findById(userId).select('completedLessons');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại',
            });
        }

        const alreadyCompleted = user.completedLessons.some(
            completedId => completedId.toString() === lesson._id.toString()
        );

        if (alreadyCompleted) {
            return res.status(200).json({
                success: true,
                message: 'Bài học đã được đánh dấu hoàn thành trước đó',
                completedLessons: user.completedLessons,
            });
        }

        user.completedLessons.push(lesson._id);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu hoàn thành bài học',
            completedLessons: user.completedLessons,
        });
    } catch (error) {
        console.error('Error completing lesson:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tiến độ',
            error: error.message,
        });
    }
};

// 3. Lấy lesson theo ID
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findById(id).select('-__v');
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found',
            });
        }
        
        return res.status(200).json({
            success: true,
            data: lesson,
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        return res.status(500).json({ success: false, message: 'Error fetching lesson', error: error.message });
    }
};

// 4. Tạo lesson mới
const createLesson = async (req, res) => {
    try {
        const { title, createdAt, exercises } = req.body;
        if (!title || !exercises || !Array.isArray(exercises)) {
            return res.status(400).json({ success: false, message: 'Title and exercises array are required' });
        }
        
        const lessonData = { title, exercises };
        if (createdAt) lessonData.createdAt = new Date(createdAt);
        
        const lesson = await Lesson.create(lessonData);
        return res.status(201).json({ success: true, data: lesson, message: 'Lesson created successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating lesson', error: error.message });
    }
};

// 5. Cập nhật lesson
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, createdAt, exercises } = req.body;
        
        const updateData = {};
        if (title) updateData.title = title;
        if (createdAt) updateData.createdAt = new Date(createdAt);
        if (exercises) updateData.exercises = exercises;
        
        const lesson = await Lesson.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-__v');
        
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        return res.status(200).json({ success: true, data: lesson, message: 'Lesson updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating lesson', error: error.message });
    }
};

// 6. Xóa lesson
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findByIdAndDelete(id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        return res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting lesson', error: error.message });
    }
};

module.exports = {
    getAllLessons,
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    completeLesson,
};
