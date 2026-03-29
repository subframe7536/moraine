import 'uno.css'

import { Show, createMemo } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import { exampleMap, pages } from 'virtual:example-pages'

import { Resizable } from '../src/elements/resizable'

import { Sidebar } from './components/sidebar'
import { useRouting } from './hooks/use-routing'
import { useTheme } from './hooks/use-theme'

function App() {
  const pageKeys = pages.map((entry) => entry.key)
  const fallbackPage = pageKeys[0]

  const { theme, updateTheme } = useTheme()
  const { page, navigate } = useRouting(pageKeys, fallbackPage)

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
            <div class="h-full overflow-y-auto" data-docs-scroll-root="true">
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
