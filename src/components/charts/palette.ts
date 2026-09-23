import { useEffect, useState } from 'react'

export const CHART_COLORS = {
  weight: { light: '#2a78d6', dark: '#3987e5' },
  pushups: { light: '#4a3aa7', dark: '#9085e9' },
  grid: { light: '#e1e0d9', dark: '#2a2838' },
  surface: { light: '#ffffff', dark: '#0f172a' },
  axis: '#898781',
} as const

const QUERY = '(prefers-color-scheme: dark)'

function readIsDark(): boolean {
  const theme = document.documentElement.dataset.theme
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia(QUERY).matches
}

/** Dark mode from the OS, overridden by data-theme on <html> when present. */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && readIsDark())
  useEffect(() => {
    const update = () => setIsDark(readIsDark())
    const mql = window.matchMedia(QUERY)
    mql.addEventListener('change', update)
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mql.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [])
  return isDark
}
