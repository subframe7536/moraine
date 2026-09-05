import { createSignal, onMount } from 'solid-js'

export type ThemeMode = 'light' | 'dark'

function getSystemTheme(): ThemeMode {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = theme === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

export function useTheme() {
  // Keep the server and hydration tree deterministic; the pre-module script owns first paint.
  const [theme, setTheme] = createSignal<ThemeMode>('light')

  onMount(() => {
    const preferredTheme = getSystemTheme()
    setTheme(preferredTheme)
    applyTheme(preferredTheme)
  })

  const updateTheme = (nextTheme: ThemeMode) => {
    const run = () => {
      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      document.startViewTransition(run)
      return
    }
    run()
  }

  return { theme, updateTheme }
}
