import { Request, Response, NextFunction } from 'express';
import * as voteService from '../services/voteService.js';
import { sendSuccess, sendNoContent, sendPaginated } from '../utils/response.js';
import { VoteInput } from '../validations/voteValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * POST /api/v1/posts/:id/vote
 * Vote on a post
 */
export async function votePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const { voteType }: VoteInput = req.body;
    const result = await voteService.votePost(postId, req.user!.userId, voteType);
    return sendSuccess(res, result, `Vote ${result.action} successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/posts/:id/vote
 * Remove vote from a post
 */
export async function removePostVote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    await voteService.removePostVote(postId, req.user!.userId);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/comments/:id/vote
 * Vote on a comment
 */
export async function voteComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const commentId = parseInt(req.params.id as string, 10);
    const { voteType }: VoteInput = req.body;
    const result = await voteService.voteComment(commentId, req.user!.userId, voteType);
    return sendSuccess(res, result, `Vote ${result.action} successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/comments/:id/vote
 * Remove vote from a comment
 */
export async function removeCommentVote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const commentId = parseInt(req.params.id as string, 10);
    await voteService.removeCommentVote(commentId, req.user!.userId);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/:id/vote
 * Get user's vote on a post
 */
export async function getPostVote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const vote = await voteService.getUserVote(req.user!.userId, 'POST', postId);
    return sendSuccess(res, { 
      hasVoted: !!vote, 
      voteType: vote ? (vote.value === 1 ? 'up' : 'down') : null 
    }, 'Vote retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/comments/:id/vote
 * Get user's vote on a comment
 */
export async function getCommentVote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const commentId = parseInt(req.params.id as string, 10);
    const vote = await voteService.getUserVote(req.user!.userId, 'COMMENT', commentId);
    return sendSuccess(res, { 
      hasVoted: !!vote, 
      voteType: vote ? (vote.value === 1 ? 'up' : 'down') : null 
    }, 'Vote retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/me/votes
 * Get current user's vote history (private)
 */
export async function getMyVoteHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const targetType = req.query.targetType as 'POST' | 'COMMENT' | undefined;
    const voteType = req.query.voteType as 'up' | 'down' | undefined;

    const result = await voteService.getUserVoteHistory(req.user!.userId, {
      page,
      limit,
      targetType,
      voteType,
    });
    
    return sendPaginated(res, result.data, result.pagination, 'Vote history retrieved successfully');
  } catch (error) {
    next(error);
  }
}








