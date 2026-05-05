import { defineEventHandler } from 'h3';
import { AnalyticsController } from '../controllers/analyticsController.js';

export type AccessLevel = 'public' | 'private';

export const analyticsAccessConfig: Record<string, AccessLevel> = {
  trackVisit: 'public',
  adminSummary: 'private',
};

export const trackVisitHandler = defineEventHandler((event) =>
  AnalyticsController.trackVisit(event),
);

export const adminSummaryHandler = defineEventHandler((event) =>
  AnalyticsController.getAdminSummary(event),
);

export const analyticsRoutes = {
  '/analytics/trackVisit': trackVisitHandler,
  '/analytics/adminSummary': adminSummaryHandler,
};
