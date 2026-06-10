import { defineEventHandler } from 'h3';
import { ResourceController } from '../controllers/resourceController.js';

export type AccessLevel = 'public' | 'private';

export const resourceAccessConfig: Record<string, AccessLevel> = {
  upload: 'private',
};

export const uploadResourceHandler = defineEventHandler((event) =>
  ResourceController.upload(event),
);

export const resourceRoutes = {
  '/resource/upload': uploadResourceHandler,
};
