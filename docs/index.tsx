import 'uno.css'

import type { Component } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, lazy, onMount } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import apiIndex from 'virtual:api-doc'

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

const DEMO_MAP: Record<string, Component> = {
  intro: lazy(() => import('./demo/guide/intro')),
  accordion: lazy(() => import('./demo/general/accordion-demos')),
  avatar: lazy(() => import('./demo/general/avatar-demos')),
  badge: lazy(() => import('./demo/general/badge-demos')),
  breadcrumb: lazy(() => import('./demo/navigation/breadcrumb-demos')),
  button: lazy(() => import('./demo/general/button-demos')),
  card: lazy(() => import('./demo/general/card-demos')),
  checkbox: lazy(() => import('./demo/form/checkbox-demos')),
  'checkbox-group': lazy(() => import('./demo/form/checkbox-group-demos')),
  collapsible: lazy(() => import('./demo/general/collapsible-demos')),
  'command-palette': lazy(() => import('./demo/navigation/command-palette-demos')),
  'context-menu': lazy(() => import('./demo/overlay/context-menu-demos')),
  dialog: lazy(() => import('./demo/overlay/dialog-demos')),
  'dropdown-menu': lazy(() => import('./demo/overlay/dropdown-menu-demos')),
  'file-upload': lazy(() => import('./demo/form/file-upload-demos')),
  form: lazy(() => import('./demo/form/form-demos')),
  'form-field': lazy(() => import('./demo/form/form-field-demos')),
  icon: lazy(() => import('./demo/general/icon-demos')),
  input: lazy(() => import('./demo/form/input-demos')),
  'input-number': lazy(() => import('./demo/form/input-number-demos')),
  kbd: lazy(() => import('./demo/general/kbd-demos')),
  pagination: lazy(() => import('./demo/navigation/pagination-demos')),
  popover: lazy(() => import('./demo/overlay/popover-demos')),
  popup: lazy(() => import('./demo/overlay/popup-demos')),
  progress: lazy(() => import('./demo/general/progress-demos')),
  'radio-group': lazy(() => import('./demo/form/radio-group-demos')),
  resizable: lazy(() => import('./demo/general/resizable-demos')),
  select: lazy(() => import('./demo/form/select-demos')),
  separator: lazy(() => import('./demo/general/separator-demos')),
  sheet: lazy(() => import('./demo/overlay/sheet-demos')),
  slider: lazy(() => import('./demo/form/slider-demos')),
  stepper: lazy(() => import('./demo/navigation/stepper-demos')),
  switch: lazy(() => import('./demo/form/switch-demos')),
  tabs: lazy(() => import('./demo/navigation/tabs-demos')),
  textarea: lazy(() => import('./demo/form/textarea-demos')),
  tooltip: lazy(() => import('./demo/overlay/tooltip-demos')),
}

function App() {
  const [theme, setTheme] = createSignal<ThemeMode>('light')

  const pages = createMemo(() => {
    const componentPages = apiIndex.components
      .filter((entry) => entry.key in DEMO_MAP)
      .map((entry) => ({ key: entry.key, label: entry.name, group: entry.category }))

    return [{ key: 'intro', label: 'Introduction', group: 'Guide' }, ...componentPages]
  })

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
    const hasDemo = Boolean(DEMO_MAP[current])
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

  const ActiveDemo = createMemo(() => DEMO_MAP[page()])

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
          defaultSize: '18%',
          min: '15%',
          max: '20%',
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
        divider: 'after:(transition-all duration-200 ease-out) hover:after:(bg-accent w-1.5)',
      }}
    />
  )
}

render(() => <App />, document.getElementById('app')!)
