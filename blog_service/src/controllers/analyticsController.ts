import { AnalyticsService } from '../services/analyticsService.js';
import { readBody, getRequestHeader } from 'h3';

export class AnalyticsController {
  static async trackVisit(event: any) {
    try {
      const body = await readBody(event);
      const userAgent = getRequestHeader(event, 'user-agent') || '';

      await AnalyticsService.trackVisit({
        path: body?.path,
        articleId: body?.articleId ? Number(body.articleId) : null,
        articleTitle: body?.articleTitle || null,
        visitorId: body?.visitorId || null,
        sessionId: body?.sessionId || null,
        referrer: body?.referrer || null,
        userAgent,
      });

      return { status: 'success' };
    } catch (error: any) {
      console.error('[AnalyticsController] trackVisit failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  static async getAdminSummary(event: any) {
    try {
      const summary = await AnalyticsService.getAdminSummary();
      return { status: 'success', data: summary };
    } catch (error: any) {
      console.error('[AnalyticsController] getAdminSummary failed:', error);
      return { status: 'error', message: error.message };
    }
  }
}
