import { Router } from 'express';
import {
  sendMessage,
  getBookingMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types/custom';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

router.post('/', (req, res, next) => sendMessage(req as AuthRequest, res, next));

router.get('/booking/:bookingId', (req, res, next) =>
  getBookingMessages(req as AuthRequest, res, next)
);

router.get('/unread-count', (req, res, next) =>
  getUnreadCount(req as AuthRequest, res, next)
);

router.put('/:id/read', (req, res, next) =>
  markAsRead(req as AuthRequest, res, next)
);

router.delete('/:id', (req, res, next) =>
  deleteMessage(req as AuthRequest, res, next)
);

export default router;

