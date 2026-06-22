import 'uno.css'

import { Show, createMemo, createSignal } from 'solid-js'
import { Dynamic, render } from 'solid-js/web'
import { exampleMap, pages } from 'virtual:example-pages'

import { Button } from '../src'

import { ContentHeader } from './components/content-header'
import { DocsCommandPalette, DocsSearchTrigger } from './components/docs-command-palette'
import { DocsShell } from './components/docs-shell'
import { Sidebar, SidebarHeader } from './components/sidebar'
import { useRouting } from './hooks/use-routing'
import { useTheme } from './hooks/use-theme'

function App() {
  const pageKeys = pages.map((entry) => entry.key)
  const fallbackPage = pageKeys[0]

  const { theme, updateTheme } = useTheme()
  const { page, navigate, navigationPending, navigationProgress } = useRouting(
    pageKeys,
    fallbackPage,
  )
  const [paletteOpen, setPaletteOpen] = createSignal(false)

  const ActiveExample = createMemo(
    () => exampleMap[page()] ?? (fallbackPage ? exampleMap[fallbackPage] : undefined),
  )

  const pageTitle = createMemo(() => pages.find((p) => p.key === page())?.label ?? '')

  return (
    <>
      <DocsShell
        sidebarHeader={(ctx) => (
          <SidebarHeader
            onClose={ctx.isMobile() ? () => ctx.setSidebarOpen(false) : undefined}
            isMobile={ctx.isMobile()}
          />
        )}
        sidebar={(ctx) => (
          <Sidebar
            pages={pages}
            activePage={page}
            setActivePage={(key) => {
              navigate(key)
              if (ctx.isMobile()) {
                ctx.setSidebarOpen(false)
              }
            }}
          />
        )}
        main={(ctx) => (
          <>
            <ContentHeader
              leading={
                <Show when={ctx.isMobile()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leading="i-lucide-menu"
                    aria-label="Toggle sidebar"
                    onClick={ctx.toggleSidebar}
                  />
                </Show>
              }
              pageTitle={pageTitle}
              scrolled={ctx.scrolled}
              theme={theme}
              setTheme={updateTheme}
              search={
                <DocsSearchTrigger
                  variant={ctx.isMobile() ? 'mobile' : 'desktop'}
                  onOpen={() => setPaletteOpen(true)}
                />
              }
            />
            <Show
              keyed
              when={ActiveExample()}
              fallback={<div class="text-sm text-muted-foreground p-6">Example not found.</div>}
            >
              {(ActiveExampleComponent) => <Dynamic component={ActiveExampleComponent} />}
            </Show>
            <Show when={navigationPending() || navigationProgress() > 0}>
              <div
                class="bg-transparent h-0.5 pointer-events-none inset-x-0 top-0 fixed z-50"
                aria-hidden="true"
                data-docs-progress=""
              >
                <div
                  class="bg-primary h-full shadow-[0_0_14px_var(--primary)] transition-([width,opacity] duration-200) motion-reduce:transition-none"
                  style={{
                    width: `${navigationProgress()}%`,
                    opacity: navigationPending() ? 1 : 0,
                  }}
                />
              </div>
            </Show>
          </>
        )}
      />
      <DocsCommandPalette
        pages={pages}
        open={paletteOpen}
        setOpen={setPaletteOpen}
        onNavigate={(key) => navigate(key)}
      />
    </>
  )
}

render(() => <App />, document.getElementById('app')!)
