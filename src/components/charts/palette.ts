import { useEffect, useState } from 'react'

export const CHART_COLORS = {
  weight: { light: '#2a78d6', dark: '#3987e5' },
  pushups: { light: '#4a3aa7', dark: '#9085e9' },
  grid: { light: '#e1e0d9', dark: '#2a2838' },
  surface: { light: '#ffffff', dark: '#0f172a' },
  axis: '#898781',
} as const

export function useIsDark(): boolean {
  const query = '(prefers-color-scheme: dark)'
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])
  return isDark
}
