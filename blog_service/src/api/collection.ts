import { defineEventHandler } from 'h3';
import { CollectionController } from '../controllers/collectionController.js';

// 预留的权限标记类型，后续由 API Gateway 统一鉴权
export type AccessLevel = 'public' | 'private';

// 每个合集相关接口的访问级别配置（目前全部设为 public，后续可按需调整）
export const collectionAccessConfig: Record<string, AccessLevel> = {
  submitCollection: 'public',
  findCollectionByID: 'public',
  getCollectionInfo: 'public',
  editCollection: 'public',
  deleteCollection: 'public',
  uploadImage: 'private',
};

// 将所有合集接口聚合在一个文件中导出，便于统一管理和后续按 public/private 分类

export const submitCollectionHandler = defineEventHandler((event) =>
  CollectionController.submitCollection(event),
);

export const findCollectionByIDHandler = defineEventHandler((event) =>
  CollectionController.findCollectionByID(event),
);

export const getCollectionInfoHandler = defineEventHandler((event) =>
  CollectionController.getCollectionInfo(event),
);

export const editCollectionHandler = defineEventHandler((event) =>
  CollectionController.editCollection(event),
);

export const deleteCollectionHandler = defineEventHandler((event) =>
  CollectionController.deleteCollection(event),
);

export const uploadCollectionImageHandler = defineEventHandler((event) =>
  CollectionController.uploadImage(event),
);


export const collectionRoutes = {
  '/collection/submitCollection': defineEventHandler((event) =>
    CollectionController.submitCollection(event)
  ),
  '/collection/findCollectionByID': defineEventHandler((event) =>
    CollectionController.findCollectionByID(event)
  ),
  '/collection/getCollectionInfo': defineEventHandler((event) =>
    CollectionController.getCollectionInfo(event)
  ),
  '/collection/editCollection': defineEventHandler((event) =>
    CollectionController.editCollection(event)
  ),
  '/collection/deleteCollection': defineEventHandler((event) =>
    CollectionController.deleteCollection(event)
  ),
  '/collection/uploadImage': defineEventHandler((event) =>
    CollectionController.uploadImage(event)
  ),
};
