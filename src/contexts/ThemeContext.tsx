import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  isDark: false,
  toggleTheme: () => {},
})

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('fcr-theme-mode') as ThemeMode | null
      if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
      return 'light'
    } catch {
      return 'light'
    }
  })

  const applyTheme = (m: ThemeMode) => {
    const resolved = resolveMode(m)
    const root = document.documentElement
    root.setAttribute('data-no-transition', '')
    root.setAttribute('data-theme', resolved)
    try { localStorage.setItem('fcr-theme-mode', m) } catch {}
    requestAnimationFrame(() => root.removeAttribute('data-no-transition'))
  }

  useEffect(() => {
    applyTheme(mode)

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  const setMode = (m: ThemeMode) => setModeState(m)
  const toggleTheme = () => setModeState(m => m === 'dark' ? 'light' : 'dark')
  const isDark = resolveMode(mode) === 'dark'

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
