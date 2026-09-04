import express from 'express';
import { getContent, updateContent } from '../controllers/contentController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';
import { scopeTenant } from '../middleware/tenant.js';

const router = express.Router();

router.get('/:key', getContent);
router.post('/:key', authenticate, requireProfileComplete, authorize('admin', 'client'), scopeTenant, updateContent);

export default router;
