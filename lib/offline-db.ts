'use client';
import { openDB } from 'idb';
import type { OfflineReport } from '@/lib/types';

const DB_NAME = 'innova-emergencias-offline';
const STORE = 'reports';

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: 'id' });
    }
  });
}

export async function saveOfflineReport(report: OfflineReport) {
  return (await db()).put(STORE, report);
}
export async function getOfflineReports(): Promise<OfflineReport[]> {
  return (await db()).getAll(STORE);
}
export async function deleteOfflineReport(id: string) {
  return (await db()).delete(STORE, id);
}
export async function updateOfflineReport(report: OfflineReport) {
  return (await db()).put(STORE, report);
}
