// Progress photos are too big for localStorage, so they live in IndexedDB as
// downscaled JPEG data URLs keyed by id.

const DB_NAME = 'fitness-tracker'
const STORE = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export function getPhoto(id: string): Promise<string | undefined> {
  return run('readonly', (s) => s.get(id) as IDBRequest<string | undefined>)
}

export async function putPhoto(id: string, dataUrl: string): Promise<void> {
  await run('readwrite', (s) => s.put(dataUrl, id))
}

export async function deletePhoto(id: string): Promise<void> {
  await run('readwrite', (s) => s.delete(id))
}

export async function clearPhotos(): Promise<void> {
  await run('readwrite', (s) => s.clear())
}

/** Downscale an image file to a JPEG data URL (longest side `maxSide`). */
export function fileToJpegDataUrl(file: File, maxSide = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}
