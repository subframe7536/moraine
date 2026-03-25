import 'uno.css'

import { Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import apiIndex from 'virtual:api-doc'
import { demoMap, pages as demoPages } from 'virtual:demo-pages'

import { Resizable } from '../src/elements/resizable'

import { Sidebar } from './components/sidebar'

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

function toTitleCaseFromKey(key: string): string {
  return key
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const componentMap = new Map(apiIndex.components.map((entry) => [entry.key, entry.name]))
function App() {
  const [theme, setTheme] = createSignal<ThemeMode>('light')

  const pages = createMemo(() =>
    demoPages.map((page) =>
      Object.assign(
        {
          key: page.key,
          label: componentMap.get(page.key) ?? toTitleCaseFromKey(page.key),
        },
        page.group ? { group: page.group } : {},
      ),
    ),
  )

  const [page, setPage] = createSignal(location.hash.slice(1) || 'intro')

  onMount(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)

    window.addEventListener('hashchange', () => {
      setPage(location.hash.slice(1) || 'button')
    })
  })

  createEffect(() => {
    const current = page()
    const hasDemo = Boolean(demoMap[current])
    if (hasDemo) {
      return
    }
    const first = pages()[0]?.key
    if (first) {
      setPage(first)
      location.hash = first
    }
  })

  const navigate = (key: string) => {
    location.hash = key
    setPage(key)
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

  const ActiveDemo = createMemo(() => demoMap[page()])

  return (
    <Resizable
      panels={[
        {
          content: (
            <Sidebar
              pages={pages()}
              activePage={page}
              setActivePage={navigate}
              theme={theme}
              setTheme={updateTheme}
            />
          ),
          defaultSize: '15%',
          min: '12%',
          max: '18%',
        },
        {
          content: (
            <div class="overflow-y-auto">
              <Show
                when={ActiveDemo()}
                fallback={<div class="text-sm text-muted-foreground p-6">Demo not found.</div>}
              >
                <Dynamic component={ActiveDemo()!} />
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
