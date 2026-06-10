import busboy from 'busboy';
import { getHeader, readBody } from 'h3';
import { ResourceService, type ResourcePurpose } from '../services/resourceService.js';

type UploadFields = {
  purpose?: string;
  title?: string;
  filename?: string;
  mimeType?: string;
};

const firstString = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : '';
  return value === undefined || value === null ? '' : String(value);
};

const normalizeJsonPayload = (body: any) => {
  const dataUrl =
    firstString(body?.resource) ||
    firstString(body?.file) ||
    firstString(body?.image) ||
    firstString(body?.data);

  return {
    dataUrl,
    fields: {
      purpose: firstString(body?.purpose || body?.kind || body?.type),
      title: firstString(body?.title),
      filename: firstString(body?.filename || body?.name),
      mimeType: firstString(body?.mimeType),
    },
  };
};

export class ResourceController {
  static async upload(event: any, defaultPurpose: ResourcePurpose = 'article-image') {
    const contentType = getHeader(event, 'content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return this.uploadMultipart(event, defaultPurpose);
    }

    return this.uploadJson(event, defaultPurpose);
  }

  private static async uploadJson(event: any, defaultPurpose: ResourcePurpose) {
    try {
      const body = await readBody(event);
      const { dataUrl, fields } = normalizeJsonPayload(body);

      if (!dataUrl) {
        return { status: 'fail', statusCode: 400, message: 'Missing resource payload' };
      }

      const result = await ResourceService.saveDataUrl(dataUrl, {
        ...fields,
        purpose: fields.purpose || defaultPurpose,
        originalName: fields.filename || fields.title,
      });

      return result;
    } catch (error: any) {
      return {
        status: 'fail',
        statusCode: 500,
        message: error.message || 'Error saving resource',
      };
    }
  }

  private static uploadMultipart(event: any, defaultPurpose: ResourcePurpose) {
    return new Promise((resolve) => {
      try {
        const bb = busboy({ headers: event.node.req.headers });
        const fields: UploadFields = {};
        let stagedUpload: Promise<any> | null = null;
        let originalName = '';
        let mimeType = '';
        let fileReceived = false;

        bb.on('file', (name, file, info) => {
          if (!['resource', 'file', 'image', 'video', 'music'].includes(name)) {
            file.resume();
            return;
          }

          fileReceived = true;
          originalName = info.filename || '';
          mimeType = info.mimeType || '';
          stagedUpload = ResourceService.stageStream(file);
        });

        bb.on('field', (name, value) => {
          if (name === 'purpose' || name === 'kind' || name === 'type') {
            fields.purpose = value;
          }
          if (name === 'title') fields.title = value;
          if (name === 'filename') fields.filename = value;
          if (name === 'mimeType') fields.mimeType = value;
        });

        bb.on('finish', async () => {
          try {
            if (!fileReceived || !stagedUpload) {
              resolve({ status: 'fail', statusCode: 400, message: 'Missing resource file' });
              return;
            }

            const staged = await stagedUpload;
            const result = await ResourceService.commitStagedUpload(staged, {
              purpose: fields.purpose || defaultPurpose,
              title: fields.title,
              originalName: fields.filename || originalName,
              mimeType: fields.mimeType || mimeType,
            });

            resolve(result);
          } catch (error: any) {
            resolve({
              status: 'fail',
              statusCode: 500,
              message: error.message || 'Error saving resource',
            });
          }
        });

        bb.on('error', (error) => {
          resolve({
            status: 'fail',
            statusCode: 500,
            message: error.message || 'Error parsing upload',
          });
        });

        event.node.req.pipe(bb);
      } catch (error: any) {
        resolve({
          status: 'fail',
          statusCode: 500,
          message: error.message || 'Error processing upload',
        });
      }
    });
  }
}
