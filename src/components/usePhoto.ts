import { useEffect, useState } from 'react'
import { getPlatform } from '../platform'

export function usePhoto(id: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let cancelled = false
    if (!id) {
      setUrl(undefined)
      return
    }
    getPlatform()
      .then((p) => p.photoUrl(id))
      .then((u) => {
        if (!cancelled) setUrl(u)
      })
    return () => {
      cancelled = true
    }
  }, [id])
  return url
}
