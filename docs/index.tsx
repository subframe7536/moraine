import 'uno.css'

import { Show, createMemo, createSignal } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import { exampleMap, pages } from 'virtual:example-pages'

import { Button, Sheet } from '../src'
import { Resizable } from '../src/elements/resizable'

import { Sidebar } from './components/sidebar'
import { useIsMobile } from './hooks/use-mobile'
import { useRouting } from './hooks/use-routing'
import { useTheme } from './hooks/use-theme'

function App() {
  const pageKeys = pages.map((entry) => entry.key)
  const fallbackPage = pageKeys[0]

  const { theme, updateTheme } = useTheme()
  const { page, navigate } = useRouting(pageKeys, fallbackPage)
  const isMobile = useIsMobile()
  const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false)

  const ActiveExample = createMemo(
    () => exampleMap[page()] ?? (fallbackPage ? exampleMap[fallbackPage] : undefined),
  )

  const navigateAndCloseSidebar = (key: string) => {
    navigate(key)
    setMobileSidebarOpen(false)
  }

  return (
    <div class="h-screen overflow-hidden">
      {/* Mobile layout */}
      <Show when={isMobile()}>
        <div class="flex flex-col h-full">
          <header class="flex items-center h-14 border-b border-border px-4 bg-background shrink-0">
            <Sheet
              side="left"
              open={mobileSidebarOpen()}
              onOpenChange={setMobileSidebarOpen}
              close={false}
              classes={{
                body: '!p-0 !overflow-hidden',
              }}
              body={
                <Sidebar
                  pages={pages}
                  activePage={page}
                  setActivePage={navigateAndCloseSidebar}
                  theme={theme}
                  setTheme={updateTheme}
                  onClose={() => setMobileSidebarOpen(false)}
                />
              }
            >
              <Button
                variant="ghost"
                size="sm"
                leading="i-lucide-menu"
                aria-label="Toggle sidebar"
              />
            </Sheet>
            <span class="ms-3 font-semibold text-foreground">Moraine</span>
          </header>
          <div class="flex-1 min-h-0 overflow-y-auto" data-docs-scroll-root="true">
            <Show
              when={ActiveExample()}
              fallback={
                <div class="text-sm text-muted-foreground p-6">Example not found.</div>
              }
            >
              <Dynamic component={ActiveExample()!} />
            </Show>
          </div>
        </div>
      </Show>

      {/* Desktop layout */}
      <Show when={!isMobile()}>
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
              defaultSize: '18%',
              min: 240,
              max: 400,
            },
            {
              content: (
                <div class="h-full overflow-y-auto" data-docs-scroll-root="true">
                  <Show
                    when={ActiveExample()}
                    fallback={
                      <div class="text-sm text-muted-foreground p-6">Example not found.</div>
                    }
                  >
                    <Dynamic component={ActiveExample()!} />
                  </Show>
                </div>
              ),
            },
          ]}
          orientation="horizontal"
          classes={{
            root: 'h-full',
            divider: 'after:(transition duration-200 ease-out) hover:after:(bg-accent w-1.5)',
          }}
        />
      </Show>
    </div>
  )
}

render(() => <App />, document.getElementById('app')!)
