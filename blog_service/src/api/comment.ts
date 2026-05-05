import { defineEventHandler } from 'h3';
import { CommentController } from '../controllers/commentController.js';

export type AccessLevel = 'public' | 'private';

export const commentAccessConfig: Record<string, AccessLevel> = {
  loadComments: 'public',
  submitComment: 'public',
  getLatestComments: 'private',
};

export const loadCommentsHandler = defineEventHandler((event) =>
  CommentController.loadComments(event),
);

export const submitCommentHandler = defineEventHandler((event) =>
  CommentController.submitComment(event),
);

export const getLatestCommentsHandler = defineEventHandler((event) =>
  CommentController.getLatestComments(event),
);

export const commentRoutes = {
  '/comment/loadComments': loadCommentsHandler,
  '/comment/submitComment': submitCommentHandler,
  '/comment/getLatestComments': getLatestCommentsHandler,

  // 兼容旧前端页面里曾经使用过的短路径。
  '/loadComments': loadCommentsHandler,
  '/submitComment': submitCommentHandler,
  '/comment': submitCommentHandler,
};
