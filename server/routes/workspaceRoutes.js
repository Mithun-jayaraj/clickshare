import express from 'express';
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  joinWorkspace,
  removeMember,
  updateMemberRole,
  regenerateInvite,
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.post('/join', joinWorkspace);
router.get('/:id', getWorkspace);
router.patch('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:id/regenerate-invite', regenerateInvite);
router.delete('/:id/members/:memberId', removeMember);
router.patch('/:id/members/:memberId/role', updateMemberRole);

export default router;
