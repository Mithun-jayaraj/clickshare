import express from 'express';
import { getUrlAnalytics, getOverview } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// IMPORTANT: /overview must come before /:urlId to avoid being matched as urlId
router.get('/overview', getOverview);
router.get('/:urlId', getUrlAnalytics);

export default router;
