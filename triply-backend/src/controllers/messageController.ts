import { Response, NextFunction } from 'express';
import { Message, Booking, User } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, PaginationQuery } from '../types/custom';

/**
 * Send a message
 * POST /api/v1/messages
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId, receiverId, message, attachments } = req.body;
    const senderId = req.user.userId;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify sender has access to this booking
    const isAdmin = req.user.role === 'admin';
    const isOwner = booking.userId.toString() === senderId;

    if (!isAdmin && !isOwner) {
      throw new AppError('You do not have access to this booking', 403);
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    const newMessage = await Message.create({
      bookingId,
      senderId,
      receiverId,
      message,
      attachments: attachments || [],
    });

    await newMessage.populate('senderId', 'firstName lastName profileImage');

    createdResponse(res, 'Message sent successfully', newMessage);
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a booking
 * GET /api/v1/messages/booking/:bookingId
 */
export const getBookingMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const { page = '1', limit = '50' } = req.query as PaginationQuery;
    const userId = req.user.userId;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = booking.userId.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new AppError('You do not have access to this booking', 403);
    }

    const [messages, total] = await Promise.all([
      Message.find({ bookingId })
        .populate('senderId', 'firstName lastName profileImage role')
        .populate('receiverId', 'firstName lastName profileImage role')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: 1 }), // Oldest first for chat view
      Message.countDocuments({ bookingId }),
    ]);

    // Mark messages as read for the current user
    await Message.updateMany(
      { bookingId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    successResponse(
      res,
      'Messages retrieved successfully',
      messages,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 * PUT /api/v1/messages/:id/read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOneAndUpdate(
      { _id: id, receiverId: userId },
      { isRead: true },
      { new: true }
    );

    if (!message) {
      throw new AppError('Message not found or you are not the recipient', 404);
    }

    successResponse(res, 'Message marked as read', { messageId: id, isRead: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 * DELETE /api/v1/messages/:id
 */
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const query: Record<string, unknown> = { _id: id };
    if (!isAdmin) {
      query.senderId = userId;
    }

    const message = await Message.findOneAndDelete(query);

    if (!message) {
      throw new AppError('Message not found or you do not have permission to delete it', 404);
    }

    successResponse(res, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 * GET /api/v1/messages/unread-count
 */
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    successResponse(res, 'Unread count retrieved', { unreadCount: count });
  } catch (error) {
    next(error);
  }
};

