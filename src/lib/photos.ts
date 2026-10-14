// Reflection photos, stored on the device only (IndexedDB), one per
// day + dimension. Images are shrunk before saving so storage stays small.

import { useEffect, useState } from 'react'
import type { DayKey } from './date'
import type { DimensionId } from './dimensions'

const DB = 'fullday-photos'
const STORE = 'photos'
const MAX_SIDE = 1280

export interface PhotoRecord {
  key: string
  day: DayKey
  dimension: DimensionId
  blob: Blob
  savedAt: number
}

export const photoKey = (day: DayKey, dim: DimensionId) => `${day}:${dim}`

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'key' })
      store.createIndex('day', 'day')
      store.createIndex('dimension', 'dimension')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Scale so the longest side is ≤ 1280px and re-encode as JPEG. */
export async function shrink(file: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('could not encode image'))), 'image/jpeg', 0.82),
  )
}

export async function savePhoto(day: DayKey, dimension: DimensionId, file: Blob): Promise<void> {
  const blob = await shrink(file)
  const rec: PhotoRecord = { key: photoKey(day, dimension), day, dimension, blob, savedAt: Date.now() }
  await tx('readwrite', (s) => s.put(rec))
  window.dispatchEvent(new CustomEvent('photos-changed'))
}

export async function deletePhoto(day: DayKey, dimension: DimensionId): Promise<void> {
  await tx('readwrite', (s) => s.delete(photoKey(day, dimension)))
  window.dispatchEvent(new CustomEvent('photos-changed'))
}

export async function getPhoto(day: DayKey, dimension: DimensionId): Promise<PhotoRecord | undefined> {
  return tx('readonly', (s) => s.get(photoKey(day, dimension)) as IDBRequest<PhotoRecord | undefined>)
}

/** Object URL for a saved photo, or null; refreshes when photos change. */
export function usePhotoUrl(day: DayKey, dimension: DimensionId): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let current: string | null = null
    let alive = true
    const load = () =>
      getPhoto(day, dimension)
        .then((rec) => {
          if (!alive) return
          if (current) URL.revokeObjectURL(current)
          current = rec ? URL.createObjectURL(rec.blob) : null
          setUrl(current)
        })
        .catch(() => setUrl(null))
    void load()
    window.addEventListener('photos-changed', load)
    return () => {
      alive = false
      window.removeEventListener('photos-changed', load)
      if (current) URL.revokeObjectURL(current)
    }
  }, [day, dimension])
  return url
}
