import { UploadService } from '../services/uploadService.js';
import { readBody } from 'h3';

export class UploadController {
  /**
   * 上传图片
   */
  static async uploadImage(event: any) {
    try {
      const body = await readBody(event);
      const { image, title } = body;

      const result = await UploadService.uploadImage(image, title);
      return {
        status: 'success',
        filePath: result.filePath,
      };
    } catch (error: any) {
      console.error('❌ Error saving the image:', error);
      return {
        statusCode: 500,
        status: 'fail',
        message: error.message || 'Error saving the image',
      };
    }
  }
}

