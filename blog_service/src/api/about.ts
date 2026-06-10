import { defineEventHandler } from 'h3';
import { AboutController } from '../controllers/aboutController.js';

export type AccessLevel = 'public' | 'private';

export const aboutAccessConfig: Record<string, AccessLevel> = {
  getSegments: 'public',
  createSegment: 'private',
  updateSegment: 'private',
  deleteSegment: 'private',
};

export const getSegmentsHandler = defineEventHandler((event) =>
  AboutController.getSegments(event),
);

export const createSegmentHandler = defineEventHandler((event) =>
  AboutController.createSegment(event),
);

export const updateSegmentHandler = defineEventHandler((event) =>
  AboutController.updateSegment(event),
);

export const deleteSegmentHandler = defineEventHandler((event) =>
  AboutController.deleteSegment(event),
);

export const aboutRoutes = {
  '/about/getSegments': getSegmentsHandler,
  '/about/createSegment': createSegmentHandler,
  '/about/updateSegment': updateSegmentHandler,
  '/about/deleteSegment': deleteSegmentHandler,
};
