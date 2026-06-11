import { defineEventHandler } from 'h3';
import { SearchController } from '../controllers/searchController.js';

export type AccessLevel = 'public' | 'private';

export const searchAccessConfig: Record<string, AccessLevel> = {
  content: 'public',
};

export const searchContentHandler = defineEventHandler((event) =>
  SearchController.searchContent(event),
);

export const searchRoutes = {
  '/search/content': searchContentHandler,
};
