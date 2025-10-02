// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { openDB, DBSchema } from 'idb';
import type { GeneratedFile } from '../types.ts';

const DB_NAME = 'devcore-db';
const DB_VERSION = 1;
const STORE_NAME = 'generated-files';

interface DevCoreDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: GeneratedFile;
    indexes: { 'by-filePath': string };
  };
}

const dbPromise = openDB<DevCoreDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore(STORE_NAME, {
      keyPath: 'filePath',
    });
    store.createIndex('by-filePath', 'filePath');
  },
});

export const saveFile = async (file: GeneratedFile): Promise<void> => {
  const db = await dbPromise;
  await db.put(STORE_NAME, file);
};

export const getAllFiles = async (): Promise<GeneratedFile[]> => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};

export const clearAllFiles = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear(STORE_NAME);
};
