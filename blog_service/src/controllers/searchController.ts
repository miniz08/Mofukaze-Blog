import { getQuery } from 'h3';
import { SearchService } from '../services/searchService.js';

export class SearchController {
  static async searchContent(event: any) {
    try {
      const query = getQuery(event);
      const keyword = String(query.q || query.keyword || '').trim();
      const limit = Number(query.limit || 6);

      const data = await SearchService.searchContent(
        keyword,
        Number.isFinite(limit) ? limit : 6,
      );

      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message || 'Search failed' };
    }
  }
}
