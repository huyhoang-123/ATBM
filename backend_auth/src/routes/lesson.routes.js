const express = require('express');
const router = express.Router();
const {
    getAllLessons,
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    completeLesson
} = require('../controllers/lesson.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- ROUTES LẤY DỮ LIỆU ---

router.get('/', authMiddleware, getAllLessons);

// Lấy chi tiết một bài học
router.get('/:id', getLessonById);

// --- ROUTES XỬ LÝ TIẾN ĐỘ ---

// Đánh dấu hoàn thành bài học - POST /api/lessons/:id/complete
router.post('/:id/complete', authMiddleware, completeLesson);

// --- ROUTES QUẢN TRỊ (ADMIN) ---

// Tạo, sửa, xóa cần quyền admin hoặc ít nhất là login
router.post('/', authMiddleware, createLesson);
router.put('/:id', authMiddleware, updateLesson);
router.delete('/:id', authMiddleware, deleteLesson);

module.exports = router;
