import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class UploadService {

  /**
   * 上传图片（负责：文件写入 + 生成数据库路径）
   */
  static async uploadImage(image: string, title: string) {
    if (!image || !title) {
      throw new Error('Missing image or title');
    }

    // -----------------------------
    // ① 格式化文件名（安全处理层）
    // -----------------------------
    const safeTitle = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // -----------------------------
    // ② 确定上传目录（环境配置层）
    // -----------------------------
    const uploadDir = process.env.UPLOAD_DIR;
    if (!uploadDir) {
      throw new Error('UPLOAD_DIR environment variable is not set');
    }

    await mkdir(uploadDir, { recursive: true });

    // -----------------------------
    // ③ 写入文件（⭐ 物理存储层）
    // -----------------------------
    const filePath = join(uploadDir, `${safeTitle}.jpeg`);
    await writeFile(filePath, Buffer.from(base64Data, 'base64'));

    // -----------------------------
    // ④ 生成前端与数据库使用的 URL（⭐ 路径保存层）
    // // -----------------------------
    const headDir=process.env.UPLOAD_URL;
    const fileUrl = `/img/${safeTitle}.jpeg`;

    // ⭐ fileUrl：前端使用 & 数据库保存  
    // ⭐ filePath：后端内部使用（绝对路径）

    return {
      fileUrl,  // 给数据库保存 & 前端渲染
      filePath, // 后端物理写入路径
    };
  }
}
