import { defineEventHandler } from 'h3';
import { ArticleController } from '../../controllers/articleController.js';

export default defineEventHandler(async (event) => {
    return await ArticleController.deleteArticlesByTag(event);
});