import express from 'express';
import {
  getAllGames,
  getGameById,
  searchGames,
  filterGames,
  addGame,
  updateGame,
  deleteGame
} from '../controllers/gameController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllGames);
router.get('/search', searchGames);
router.get('/filter', filterGames);
router.get('/:gameId', getGameById);

// Admin routes - supports both file upload (multer) and Base64 in body
router.post('/', verifyToken, verifyAdmin, upload.single('image'), addGame);
router.put('/:gameId', verifyToken, verifyAdmin, upload.single('image'), updateGame);
router.delete('/:gameId', verifyToken, verifyAdmin, deleteGame);

export default router;