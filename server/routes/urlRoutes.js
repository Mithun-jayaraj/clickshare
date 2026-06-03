import express from 'express';
import { getUrls, createUrl, deleteUrl, updateUrl } from '../controllers/urlController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUrls);
router.post('/', createUrl);
router.delete('/:id', deleteUrl);
router.patch('/:id', updateUrl);

export default router;
