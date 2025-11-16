import { defineEventHandler } from 'h3';
import { UploadController } from '../controllers/uploadController.js';

export default defineEventHandler(async (event) => {
    return await UploadController.uploadImage(event);
});
