import express from 'express';
import { getContent, updateContent } from '../controllers/contentController.js';

const router = express.Router();

router.get('/:key', getContent);
router.post('/:key', updateContent);

export default router;
