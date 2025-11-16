import { defineEventHandler } from 'h3';
import { ArticleController } from '../../controllers/articleController.js';

export default defineEventHandler(async (event) => {
  console.log('[Handler] 进入 getLatestArticles');
  try {
    const result = await ArticleController.getLatestArticles(event);
    console.log('[Handler] 控制器返回：', result);
    return result;
  } catch (err) {
    console.error('[Handler] 出错啦：', err);
    return { status: 'error', message: err.message };
  }
});
