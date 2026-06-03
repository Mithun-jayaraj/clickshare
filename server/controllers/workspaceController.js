import Workspace from '../models/Workspace.js';
import { nanoid } from 'nanoid';

/**
 * GET /api/workspaces
 * Get all workspaces where user is owner or member
 */
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Workspace name is required.' });
    }

    const inviteCode = nanoid(10);

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      inviteCode,
      members: [],
    });

    await workspace.populate('owner', 'name email');

    res.status(201).json({ success: true, message: 'Workspace created successfully.', workspace });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:id
 * Get a specific workspace (members only)
 */
export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const isMember =
      workspace.owner._id.toString() === req.user._id.toString() ||
      workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:id
 * Update workspace name/description (owner/admin only)
 */
export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const isOwnerOrAdmin =
      workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(
        (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
      );

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, message: 'Only owners and admins can update workspaces.' });
    }

    if (name?.trim()) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description.trim();

    await workspace.save();
    await workspace.populate('owner', 'name email');
    await workspace.populate('members.user', 'name email');

    res.status(200).json({ success: true, message: 'Workspace updated.', workspace });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:id
 * Delete workspace (owner only)
 */
export const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can delete a workspace.' });
    }

    await Workspace.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Workspace deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces/join
 * Join a workspace by invite code
 */
export const joinWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required.' });
    }

    const workspace = await Workspace.findOne({ inviteCode, inviteEnabled: true });
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite code.' });
    }

    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You are the owner of this workspace.' });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this workspace.' });
    }

    workspace.members.push({ user: req.user._id, role: 'viewer' });
    await workspace.save();
    await workspace.populate('owner', 'name email');
    await workspace.populate('members.user', 'name email');

    res.status(200).json({ success: true, message: `Joined workspace "${workspace.name}".`, workspace });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:id/members/:memberId
 * Remove a member (owner/admin can remove others; members can remove themselves)
 */
export const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const requesterId = req.user._id.toString();
    const targetId = req.params.memberId;

    const isOwner = workspace.owner.toString() === requesterId;
    const isAdmin = workspace.members.some(
      (m) => m.user.toString() === requesterId && m.role === 'admin'
    );
    const isSelf = requesterId === targetId;

    if (!isOwner && !isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this member.' });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== targetId);
    await workspace.save();

    res.status(200).json({ success: true, message: 'Member removed.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:id/members/:memberId/role
 * Change a member's role (owner only)
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, editor, or viewer.' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can change member roles.' });
    }

    const member = workspace.members.find((m) => m.user.toString() === req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.role = role;
    await workspace.save();

    res.status(200).json({ success: true, message: `Role updated to ${role}.` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces/:id/regenerate-invite
 * Regenerate invite code (owner only)
 */
export const regenerateInvite = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can regenerate the invite code.' });
    }

    workspace.inviteCode = nanoid(10);
    await workspace.save();

    res.status(200).json({ success: true, inviteCode: workspace.inviteCode });
  } catch (error) {
    next(error);
  }
};
