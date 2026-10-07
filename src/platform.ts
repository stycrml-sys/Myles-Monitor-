// The app runs in two places:
//  - as a plain web page (GitHub Pages / dev server): data in localStorage,
//    photos in IndexedDB, photo notes via the user's own Claude API key;
//  - as a claude.ai Artifact: data in the artifact's `db` (private to each
//    signed-in viewer, synced across devices), photos in `assets`, photo notes
//    via `sample` (the viewer's own Claude account), backups via `downloads`.
// Everything else in the app talks to the `Platform` interface below.

import { clearPhotos, deletePhoto as idbDelete, getPhoto, putPhoto } from './photoStore'
import type { FitnessData } from './types'

export interface AnalysisRequest {
  prompt: string
  images: Blob[]
}

export interface Platform {
  kind: 'web' | 'artifact'
  /** Where data is kept, for the Settings sheet. */
  storageNote: string
  load(): Promise<Partial<FitnessData> | null>
  save(data: FitnessData): Promise<void>
  savePhoto(blob: Blob): Promise<string>
  photoUrl(id: string): Promise<string | undefined>
  photoBlob(id: string): Promise<Blob | undefined>
  deletePhoto(id: string): Promise<void>
  deleteAllPhotos(ids: string[]): Promise<void>
  /** Offer a file to the user. Rejects with a readable message on failure. */
  saveFile(filename: string, text: string): Promise<void>
  /** Built-in photo analysis (artifact); null means "use an API key" (web). */
  analyze: ((req: AnalysisRequest) => Promise<string>) | null
  /** Built-in quick question answered as JSON (artifact); null on the web. */
  askJson: ((prompt: string) => Promise<unknown>) | null
}

// ---------- helpers ----------

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob()
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// ---------- web ----------

const STORAGE_KEY = 'fitness-tracker:data:v1'
const MAIN_DOC = 'fitness'

interface MonthDoc {
  weights: FitnessData['weights']
  pushups: FitnessData['pushups']
  foods: FitnessData['foods']
}

function monthDoc(date: string): string {
  return `log-${date.slice(0, 7)}`
}

function webPlatform(): Platform {
  return {
    kind: 'web',
    storageNote: 'All data and photos live only in this browser.',
    async load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as Partial<FitnessData>) : null
      } catch {
        return null
      }
    },
    async save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // Storage full or blocked; nothing more we can do here.
      }
    },
    async savePhoto(blob) {
      const id = `photo-${newId()}`
      await putPhoto(id, await blobToDataUrl(blob))
      return id
    },
    photoUrl: (id) => getPhoto(id),
    async photoBlob(id) {
      const url = await getPhoto(id)
      return url ? dataUrlToBlob(url) : undefined
    },
    deletePhoto: (id) => idbDelete(id),
    deleteAllPhotos: () => clearPhotos(),
    async saveFile(filename, text) {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    analyze: null,
    askJson: null,
  }
}

// ---------- artifact ----------

// Minimal shapes for the parts of the claude.ai artifact runtime we use.
interface DocSnap {
  exists: boolean
  data(): Record<string, unknown> | undefined
}
interface DbNs {
  doc(path: string): {
    get(): Promise<DocSnap>
    set(data: Record<string, unknown>): Promise<void>
  }
  collection(path: string): {
    get(): Promise<{ docs: (DocSnap & { id: string })[] }>
  }
}
interface AssetsNs {
  upload(blob: Blob, options?: { type?: string }): Promise<{ id: string; url: string }>
  delete(ref: string): Promise<{ deleted: boolean }>
}
interface UserNs {
  id(): Promise<string | null>
}
type SampleOptions = { images?: Blob[]; modelTier?: string; cache?: boolean }
interface SampleNs {
  (input: string, options?: SampleOptions): Promise<{ text: string; truncated: boolean }>
  json(input: string, options?: SampleOptions): Promise<unknown>
  limits(): Promise<{ images?: { maxCount: number } }>
}
interface DownloadsNs {
  save(req: { filename: string; data: string }): Promise<{ status: string }>
}
interface ClaudeRuntime {
  use(name: string): Promise<unknown>
}

function runtime(): ClaudeRuntime | null {
  const c = (window as unknown as { claude?: ClaudeRuntime }).claude
  return c && typeof c.use === 'function' ? c : null
}

function errorCode(e: unknown): string {
  return typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : ''
}

async function artifactPlatform(claude: ClaudeRuntime): Promise<Platform | null> {
  const [db, user, assets, sample, downloads] = (await Promise.all(
    ['db', 'user', 'assets', 'sample', 'downloads'].map((n) => claude.use(n).catch(() => null)),
  )) as [DbNs | null, UserNs | null, AssetsNs | null, SampleNs | null, DownloadsNs | null]

  const uid = user ? await user.id().catch(() => null) : null
  if (!db || !uid) return null
  const base = `data/users/${uid}`

  // Stored documents are capped at 256 KiB, so daily logs are split into one
  // document per month (`log-2026-10`); `fitness` holds settings and photo
  // check-ins. Only documents whose contents changed are written.
  const written = new Map<string, string>()

  const toDocs = (data: FitnessData): Map<string, Record<string, unknown>> => {
    const docs = new Map<string, Record<string, unknown>>()
    docs.set(MAIN_DOC, {
      version: data.version,
      // The API key setting is only used by the web build; never store it here.
      settings: { ...data.settings, apiKey: '' },
      checkins: data.checkins,
    })
    const month = (id: string) => {
      let doc = docs.get(id) as MonthDoc | undefined
      if (!doc) {
        doc = { weights: [], pushups: [], foods: [] }
        docs.set(id, doc as unknown as Record<string, unknown>)
      }
      return doc
    }
    for (const w of data.weights) month(monthDoc(w.date)).weights.push(w)
    for (const p of data.pushups) month(monthDoc(p.date)).pushups.push(p)
    for (const f of data.foods) month(monthDoc(f.date)).foods.push(f)
    // A month whose entries were all deleted is written back empty.
    for (const id of written.keys()) if (!docs.has(id)) docs.set(id, { weights: [], pushups: [], foods: [] })
    return docs
  }

  // One write at a time; if data changes mid-write, write the latest after.
  let writing: Promise<void> | null = null
  let pending: FitnessData | null = null
  const flush = async () => {
    while (pending) {
      const docs = toDocs(pending)
      pending = null
      // Month logs first, so moving legacy entries out of `fitness` never
      // leaves them stored nowhere.
      const ids = [...docs.keys()].sort((a, b) => (a === MAIN_DOC ? 1 : b === MAIN_DOC ? -1 : a.localeCompare(b)))
      for (const id of ids) {
        const json = JSON.stringify(docs.get(id))
        if (written.get(id) === json) continue
        try {
          await db.doc(`${base}/${id}`).set(docs.get(id)!)
          written.set(id, json)
        } catch (e) {
          console.error('Could not save', id, e)
        }
      }
    }
    writing = null
  }

  const imageLimit = sample ? await sample.limits().then((l) => l.images?.maxCount ?? 0).catch(() => 0) : 0

  return {
    kind: 'artifact',
    storageNote: 'Your data is saved to your Claude account and syncs across your devices. Photos are stored with this page.',
    async load() {
      const snap = await db.collection(base).get()
      const found = snap.docs.filter((d) => d.exists)
      if (!found.length) return null
      const merged: Partial<FitnessData> & MonthDoc = { weights: [], pushups: [], foods: [] }
      for (const d of found) {
        const body = (d.data() ?? {}) as Partial<FitnessData>
        written.set(d.id, JSON.stringify(body))
        if (d.id === MAIN_DOC) {
          merged.version = 1
          merged.settings = body.settings
          merged.checkins = body.checkins ?? []
        }
        // Older versions kept every entry in the main document; still read them.
        merged.weights.push(...(body.weights ?? []))
        merged.pushups.push(...(body.pushups ?? []))
        merged.foods.push(...(body.foods ?? []))
      }
      const newestFirst = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date)
      merged.weights.sort(newestFirst)
      merged.pushups.sort(newestFirst)
      merged.foods.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      return merged
    },
    async save(data) {
      pending = data
      if (!writing) writing = flush()
      await writing
    },
    async savePhoto(blob) {
      if (!assets) throw new Error("Photos can't be added from this view.")
      try {
        return (await assets.upload(blob, { type: blob.type || 'image/jpeg' })).id
      } catch (e) {
        const code = errorCode(e)
        if (code === 'too_large') throw new Error('That photo is too large.')
        if (code === 'quota_or_state') throw new Error('Photo storage is full. Delete some old check-ins first.')
        throw new Error("Couldn't upload that photo. Try again.")
      }
    },
    async photoUrl(id) {
      return `/_blob/${id}`
    },
    async photoBlob(id) {
      const res = await fetch(`/_blob/${id}`)
      return res.ok ? res.blob() : undefined
    },
    async deletePhoto(id) {
      await assets?.delete(id).catch(() => undefined)
    },
    async deleteAllPhotos(ids) {
      for (const id of ids) await assets?.delete(id).catch(() => undefined)
    },
    async saveFile(filename, text) {
      if (!downloads) throw new Error('Downloads are not available here.')
      try {
        await downloads.save({ filename, data: text })
      } catch (e) {
        if (errorCode(e) === 'declined') return
        throw new Error("Couldn't save the file.")
      }
    },
    analyze:
      sample && imageLimit > 0
        ? async ({ prompt, images }) => {
            if (images.length > imageLimit) images = images.slice(-imageLimit)
            try {
              const res = await sample(prompt, { images, modelTier: 'complex', cache: false })
              return res.truncated ? `${res.text}\n\n(Cut short.)` : res.text
            } catch (e) {
              const code = errorCode(e)
              if (code === 'rate_limited') throw new Error("You've hit a usage limit. Try again later.")
              if (code === 'refused') throw new Error("Claude couldn't analyse these photos. Try different shots.")
              if (code === 'not_granted' || code === 'sampling_disabled')
                throw new Error('Photo analysis needs permission to use Claude from this page.')
              if (code === 'image_rejected') throw new Error("One of the photos couldn't be read.")
              throw new Error('Something went wrong. Try again.')
            }
          }
        : null,
    askJson: sample
      ? async (prompt) => {
          try {
            return await sample.json(prompt, { modelTier: 'quick' })
          } catch (e) {
            const code = errorCode(e)
            if (code === 'rate_limited') throw new Error("You've hit a usage limit. Try again later.")
            if (code === 'not_granted' || code === 'sampling_disabled')
              throw new Error('Calorie estimates need permission to use Claude from this page.')
            throw new Error("Couldn't get an estimate. Enter the calories yourself.")
          }
        }
      : null,
  }
}

let platformPromise: Promise<Platform> | null = null

export function getPlatform(): Promise<Platform> {
  platformPromise ??= (async () => {
    const claude = runtime()
    if (claude) {
      const p = await artifactPlatform(claude).catch(() => null)
      if (p) return p
    }
    return webPlatform()
  })()
  return platformPromise
}
