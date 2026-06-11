import { getQuery, getRequestHeader, readBody } from 'h3';
import { CommentService } from '../services/commentService.js';

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null;
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null;
};

const cleanString = (value: unknown, maxLength: number) => {
  return String(value || '').trim().slice(0, maxLength);
};

const cleanOptionalString = (value: unknown, maxLength: number) => {
  const nextValue = cleanString(value, maxLength);
  return nextValue || null;
};

const getHeaderValue = (event: any, names: string[]) => {
  for (const name of names) {
    const value = cleanString(getRequestHeader(event, name), 191);
    if (value) return value;
  }
  return '';
};

const normalizeIp = (value: string) => {
  const firstIp = String(value || '').split(',')[0]?.trim() || '';
  return firstIp.replace(/^::ffff:/, '');
};

const isPrivateIp = (ip: string) => {
  return (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    /^fc|^fd/i.test(ip)
  );
};

const getClientIp = (event: any) => {
  const headerIp = getHeaderValue(event, [
    'cf-connecting-ip',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded-for',
  ]);
  return normalizeIp(headerIp || event?.node?.req?.socket?.remoteAddress || '');
};

const getIpLocation = (event: any, ip: string) => {
  const explicitLocation = getHeaderValue(event, [
    'x-ip-location',
    'x-geo-location',
    'x-real-ip-location',
  ]);
  if (explicitLocation) return explicitLocation;

  const locationParts = [
    getHeaderValue(event, ['x-ip-country', 'cf-ipcountry', 'x-vercel-ip-country']),
    getHeaderValue(event, ['x-ip-region', 'x-vercel-ip-country-region']),
    getHeaderValue(event, ['x-ip-city', 'x-vercel-ip-city']),
  ].filter(Boolean);

  if (locationParts.length) return Array.from(new Set(locationParts)).join(' ');
  if (isPrivateIp(ip)) return '本地网络';
  return '未知地区';
};

const parseUserAgent = (userAgent: string) => {
  const ua = String(userAgent || '');
  const browser = (() => {
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
    if (/Version\/[\d.]+.*Safari\//.test(ua)) return 'Safari';
    if (/MicroMessenger\//.test(ua)) return 'WeChat';
    if (/QQBrowser\//.test(ua)) return 'QQ Browser';
    return 'Unknown Browser';
  })();

  const os = (() => {
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/(iPhone|iPad|iPod)/.test(ua)) return 'iOS';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown OS';
  })();

  return { browser, os };
};

export class CommentController {
  static async loadComments(event: any) {
    try {
      const query = getQuery(event);
      const articleId = toOptionalNumber(query.articleId);
      const collectionId = toOptionalNumber(query.collectionId);
      const momentId = toOptionalNumber(query.momentId);

      if (articleId) {
        const comments = await CommentService.loadCommentsByArticleId(articleId);
        return { status: 'success', comments };
      }

      if (collectionId) {
        const comments = await CommentService.loadCommentsByCollectionId(collectionId);
        return { status: 'success', comments };
      }

      if (momentId) {
        const comments = await CommentService.loadCommentsByMomentId(momentId);
        return { status: 'success', comments };
      }

      return { status: 'error', message: 'Invalid article ID, collection ID or moment ID' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async submitComment(event: any) {
    try {
      const body = await readBody(event);
      const articleId = toOptionalNumber(body.articleId);
      const collectionId = toOptionalNumber(body.collectionId);
      const momentId = toOptionalNumber(body.momentId);
      const parentId = toOptionalNumber(body.parentId);
      const name = cleanString(body.name, 191);
      const email = cleanOptionalString(body.email, 191);
      const homepage = cleanOptionalString(body.homepage, 191);
      const content = cleanString(body.content, 5000);
      const userAgent = cleanString(getRequestHeader(event, 'user-agent'), 512);
      const clientIp = getClientIp(event);
      const { browser, os } = parseUserAgent(userAgent);

      if (!name || !content) {
        return { status: 'error', message: 'Missing required fields: name, content' };
      }

      const comment = await CommentService.submitComment({
        articleId,
        collectionId,
        momentId,
        parentId,
        name,
        email,
        homepage,
        content,
        ipLocation: getIpLocation(event, clientIp),
        userAgent,
        browser,
        os,
      });

      return { status: 'success', comment };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async getLatestComments(event: any) {
    try {
      const query = getQuery(event);
      const take = query.take ? Number(query.take) : 8;
      const comments = await CommentService.getLatestComments(
        Number.isFinite(take) ? Math.min(Math.max(take, 1), 20) : 8,
      );

      return { status: 'success', comments };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
