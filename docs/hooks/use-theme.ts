import { createSignal, onMount } from 'solid-js'

export type ThemeMode = 'light' | 'dark'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
  const initialTheme = getInitialTheme()
  const [theme, setTheme] = createSignal<ThemeMode>(initialTheme)

  onMount(() => applyTheme(initialTheme))

  const updateTheme = (nextTheme: ThemeMode) => {
    const run = () => {
      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    if (
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function'
    ) {
      document.startViewTransition(run)
      return
    }
    run()
  }

  return { theme, updateTheme }
}
