import 'uno.css'

import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import { exampleMap, pages } from 'virtual:example-pages'

import { Resizable } from '../src/elements/resizable'

import { Sidebar } from './components/sidebar'
import { resolvePageKeyFromLocation, toPagePath } from './routing'

type ThemeMode = 'light' | 'dark'

function getInitialTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode): void {
  const isDark = theme === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = createSignal<ThemeMode>('light')
  const pageKeys = pages.map((entry) => entry.key)
  const fallbackPage = pageKeys[0]
  const initialPage = resolvePageKeyFromLocation(location, pageKeys) ?? ''

  const [page, setPage] = createSignal(initialPage)

  const syncPageFromLocation = () => {
    const nextPage = resolvePageKeyFromLocation(location, pageKeys)
    if (!nextPage) {
      return
    }

    setPage(nextPage)

    const expectedPath = toPagePath(nextPage)
    if (location.pathname !== expectedPath) {
      history.replaceState(null, '', expectedPath)
    }
  }

  onMount(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)

    syncPageFromLocation()

    const handlePopstate = () => {
      syncPageFromLocation()
    }

    window.addEventListener('popstate', handlePopstate)
    onCleanup(() => {
      window.removeEventListener('popstate', handlePopstate)
    })
  })

  const navigate = (key: string) => {
    setPage(key)
    history.pushState(null, '', toPagePath(key))
  }

  const updateTheme = (nextTheme: ThemeMode) => {
    const run = () => {
      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(run)
      return
    }
    run()
  }

  const ActiveExample = createMemo(
    () => exampleMap[page()] ?? (fallbackPage ? exampleMap[fallbackPage] : undefined),
  )

  return (
    <Resizable
      panels={[
        {
          content: (
            <Sidebar
              pages={pages}
              activePage={page}
              setActivePage={navigate}
              theme={theme}
              setTheme={updateTheme}
            />
          ),
          defaultSize: '15%',
          min: 240,
          max: 400,
        },
        {
          content: (
            <div class="overflow-y-auto">
              <Show
                when={ActiveExample()}
                fallback={<div class="text-sm text-muted-foreground p-6">Example not found.</div>}
              >
                <Dynamic component={ActiveExample()!} />
              </Show>
            </div>
          ),
        },
      ]}
      orientation="horizontal"
      classes={{
        root: 'h-screen',
        divider: 'after:(transition duration-200 ease-out) hover:after:(bg-accent w-1.5)',
      }}
    />
  )
}

render(() => <App />, document.getElementById('app')!)
