import { createHash, randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { copyFile, mkdir, unlink } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { tmpdir } from 'os';
import type { Readable } from 'stream';

export type ResourcePurpose = 'article-image' | 'collection-cover' | 'video' | 'music';

type StagedUpload = {
  tempPath: string;
  hash: string;
  size: number;
};

type ResourceMeta = {
  purpose?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  title?: string | null;
};

type PurposeConfig = {
  rootDir: string;
  publicSegment: string;
  mimePrefix: string;
  keepExtension: boolean;
};

const CDN_ROOT = process.env.UPLOAD_URL || 'http://mofukaze.me';

const defaultResourceRoot = (relativePath: string) => {
  return resolve(process.cwd(), '../resource_service/resources', relativePath);
};

const PURPOSE_ALIAS: Record<string, ResourcePurpose> = {
  article: 'article-image',
  'article-image': 'article-image',
  image: 'article-image',
  text: 'article-image',
  'text-image': 'article-image',
  collection: 'collection-cover',
  cover: 'collection-cover',
  'collection-cover': 'collection-cover',
  video: 'video',
  movie: 'video',
  music: 'music',
  audio: 'music',
};

const MIME_EXTENSION: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/flac': '.flac',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
};

const normalizePurpose = (purpose: unknown, mimeType?: string | null): ResourcePurpose => {
  const normalized = String(purpose || '').trim().toLowerCase();
  if (normalized && PURPOSE_ALIAS[normalized]) return PURPOSE_ALIAS[normalized];

  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'music';
  return 'article-image';
};

const getPurposeConfig = (purpose: ResourcePurpose): PurposeConfig => {
  if (purpose === 'collection-cover') {
    return {
      rootDir:
        process.env.UPLOAD_IMG_COVER_DIR ||
        process.env.UPLOAD_IMG_TEXT_DIR ||
        defaultResourceRoot('img/cover'),
      publicSegment: 'img/cover',
      mimePrefix: 'image/',
      keepExtension: false,
    };
  }

  if (purpose === 'video') {
    return {
      rootDir: process.env.UPLOAD_VIDEO_DIR || defaultResourceRoot('video'),
      publicSegment: 'video',
      mimePrefix: 'video/',
      keepExtension: true,
    };
  }

  if (purpose === 'music') {
    return {
      rootDir: process.env.UPLOAD_MUSIC_DIR || defaultResourceRoot('music'),
      publicSegment: 'music',
      mimePrefix: 'audio/',
      keepExtension: true,
    };
  }

  return {
    rootDir: process.env.UPLOAD_IMG_TEXT_DIR || defaultResourceRoot('img/text'),
    publicSegment: 'img/text',
    mimePrefix: 'image/',
    keepExtension: false,
  };
};

const sanitizeExtension = (value?: string | null) => {
  const extension = extname(String(value || '')).toLowerCase();
  return /^[a-z0-9.]{2,12}$/.test(extension) ? extension : '';
};

const getExtension = (meta: ResourceMeta, keepExtension: boolean) => {
  if (!keepExtension) return '';
  return sanitizeExtension(meta.originalName) || MIME_EXTENSION[String(meta.mimeType || '').toLowerCase()] || '';
};

const parseDataUrl = (dataUrl: string) => {
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid base64 resource payload');
  }

  return {
    mimeType: match[1] || 'application/octet-stream',
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const validateMime = (mimeType: string | null | undefined, config: PurposeConfig) => {
  if (!mimeType) return;
  if (!mimeType.startsWith(config.mimePrefix)) {
    throw new Error(`Invalid resource type: expected ${config.mimePrefix}`);
  }
};

export class ResourceService {
  static async stageStream(fileStream: Readable): Promise<StagedUpload> {
    const tempRoot = join(tmpdir(), 'mofukaze-upload');
    await mkdir(tempRoot, { recursive: true });

    const tempPath = join(tempRoot, `${Date.now()}-${randomUUID()}.upload`);
    const hash = createHash('sha256');
    let size = 0;

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const output = createWriteStream(tempPath, { flags: 'wx' });

      fileStream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        size += chunk.length;
      });

      fileStream.on('error', rejectPromise);
      output.on('error', rejectPromise);
      output.on('finish', resolvePromise);

      fileStream.pipe(output);
    });

    return {
      tempPath,
      hash: hash.digest('hex'),
      size,
    };
  }

  static async stageBuffer(buffer: Buffer): Promise<StagedUpload> {
    const tempRoot = join(tmpdir(), 'mofukaze-upload');
    await mkdir(tempRoot, { recursive: true });

    const tempPath = join(tempRoot, `${Date.now()}-${randomUUID()}.upload`);
    const hash = createHash('sha256').update(buffer).digest('hex');

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const output = createWriteStream(tempPath, { flags: 'wx' });
      output.on('error', rejectPromise);
      output.on('finish', resolvePromise);
      output.end(buffer);
    });

    return {
      tempPath,
      hash,
      size: buffer.length,
    };
  }

  static async saveDataUrl(dataUrl: string, meta: ResourceMeta) {
    const parsed = parseDataUrl(dataUrl);
    const staged = await this.stageBuffer(parsed.buffer);

    return this.commitStagedUpload(staged, {
      ...meta,
      mimeType: meta.mimeType || parsed.mimeType,
    });
  }

  static async saveReadable(fileStream: Readable, meta: ResourceMeta) {
    const staged = await this.stageStream(fileStream);
    return this.commitStagedUpload(staged, meta);
  }

  static async commitStagedUpload(staged: StagedUpload, meta: ResourceMeta) {
    const purpose = normalizePurpose(meta.purpose, meta.mimeType);
    const config = getPurposeConfig(purpose);
    validateMime(meta.mimeType, config);

    const dir1 = staged.hash.slice(0, 2);
    const dir2 = staged.hash.slice(2, 4);
    const extension = getExtension(meta, config.keepExtension);
    const fileName = `${staged.hash}${extension}`;
    const fullDirPath = join(config.rootDir, dir1, dir2);
    const finalPath = join(fullDirPath, fileName);

    await mkdir(fullDirPath, { recursive: true });

    try {
      await copyFile(staged.tempPath, finalPath);
    } finally {
      await unlink(staged.tempPath).catch(() => undefined);
    }

    const fileUrl = `${CDN_ROOT}/${config.publicSegment}/${dir1}/${dir2}/${fileName}`;

    return {
      status: 'success',
      fileUrl,
      url: fileUrl,
      filePath: fileUrl,
      hash: staged.hash,
      size: staged.size,
      purpose,
      mimeType: meta.mimeType || null,
      originalName: meta.originalName || meta.title || null,
    };
  }

  static async hashExistingFile(path: string) {
    const hash = createHash('sha256');
    let size = 0;

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const input = createReadStream(path);
      input.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        size += chunk.length;
      });
      input.on('error', rejectPromise);
      input.on('end', resolvePromise);
    });

    return {
      hash: hash.digest('hex'),
      size,
    };
  }
}
