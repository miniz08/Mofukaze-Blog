import { defineEventHandler } from 'h3';
import { CollectionController } from '../../controllers/collectionController.js';

export default defineEventHandler(async (event) => {
    return await CollectionController.submitCollection(event);
});
