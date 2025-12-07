import express from 'express';
import {
  getAllReviews,
  getReviewsByGame,
  getReviewsByUser,
  addReview,
  updateReview,
  deleteReview,
  getAllReviewsForAdmin,
  deleteReviewByAdmin
} from '../controllers/reviewController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllReviews);
router.get('/game/:gameId', getReviewsByGame);
router.get('/user/:userId', getReviewsByUser);

// Protected routes (registered users)
router.post('/', verifyToken, addReview);
router.put('/:reviewId', verifyToken, updateReview);
router.delete('/:reviewId', verifyToken, deleteReview);

// Admin-only routes for moderation
router.get('/admin/all', verifyToken, verifyAdmin, getAllReviewsForAdmin);
router.delete('/admin/:reviewId', verifyToken, verifyAdmin, deleteReviewByAdmin);

export default router;