import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { JSX } from 'solid-js'
import { Show, Suspense, createEffect, createMemo, createSignal, untrack } from 'solid-js'

import { Button, Icon, Progress, SidebarFrame, Switch, cn } from '../../src/index'

import { DocsCommandPalette } from './components/layout/docs-command-palette'
import { Sidebar, SidebarHeader } from './components/layout/sidebar'
import { DOCS_MDX_COMPONENTS } from './components/markdown/mdx-components'
import { getDocsPages } from './docs-route'
import { useTheme } from './hooks/use-theme'

function DocsAppLayout(props: { children?: JSX.Element }): JSX.Element {
  const pages = getDocsPages()
  const location = useLocation()
  const navigate = useNavigate()
  const isRouting = useIsRouting()
  const { theme, updateTheme } = useTheme()
  const [paletteOpen, setPaletteOpen] = createSignal(false)
  const [routingFromPath, setRoutingFromPath] = createSignal<string>()
  const [mainEl, setMainEl] = createSignal<HTMLDivElement>()

  const activePage = createMemo(() => {
    const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/g, '')
    return pages.find((page) => page.path === normalizedPath)?.key ?? pages[0]?.key ?? ''
  })

  const [committedPage, setCommittedPage] = createSignal(untrack(activePage))
  const navigationLoading = createMemo(() => isRouting() && location.pathname === routingFromPath())
  let renderedPage = untrack(committedPage)

  createEffect(() => {
    const page = activePage()
    if (isRouting()) {
      return
    }

    if (page === renderedPage) {
      return
    }

    renderedPage = page
    mainEl()?.scrollTo({ top: 0 })
    setCommittedPage(page)
  })

  createEffect(() => {
    if (!isRouting()) {
      setRoutingFromPath(undefined)
      return
    }

    setRoutingFromPath((path) => path ?? untrack(() => location.pathname))
  })

  const navigateToPage = (key: string) => {
    const path = pages.find((page) => page.key === key)?.path
    if (path) {
      navigate(path)
    }
  }

  return (
    <>
      <Show when={navigationLoading()}>
        <Progress
          aria-label="Loading page"
          size="sm"
          class="pointer-events-none inset-x-0 top-0 fixed z-floating"
          classes={{
            track: 'rounded-none bg-transparent',
            indicator: 'rounded-none motion-reduce:animate-none',
          }}
        />
      </Show>
      <SidebarFrame
        mainRef={setMainEl}
        classes={{
          sidebar: 'border-none',
        }}
        sidebarHeaderRender={(ctx) => (
          <SidebarHeader
            onClose={ctx.isMobile() ? () => ctx.setOpen(false) : undefined}
            isMobile={ctx.isMobile()}
          />
        )}
        sidebarBodyRender={(ctx) => (
          <Sidebar
            pages={pages}
            activePage={committedPage}
            setActivePage={(key) => {
              navigateToPage(key)
              if (ctx.isMobile()) {
                ctx.setOpen(false)
              }
            }}
          />
        )}
        mainRender={(ctx) => (
          <>
            <a
              href="#main-content"
              class="z-toast text-foreground px-4 py-2 rounded-md bg-background transition-transform left-1/2 top-2 fixed focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background translate-y-0) -translate-x-1/2 -translate-y-full"
            >
              Skip to main content
            </a>
            <header
              data-scrolled={ctx.scrolled() ? '' : undefined}
              class={cn(
                'px-4 bg-transparent flex h-13 transition-([border-color,background-color] duration-200 ease-out) items-center top-0 justify-between sticky z-sticky backdrop-blur-md sm:px-8',
                'data-scrolled:(border-border/60 bg-background/80)',
              )}
            >
              <div class="flex gap-1 min-w-0 items-center">
                <Show when={ctx.isMobile()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leading="i-lucide-menu"
                    aria-label="Toggle sidebar"
                    onClick={ctx.toggle}
                  />
                </Show>
              </div>
              <div class="flex shrink-0 gap-2 items-center" aria-label="Page actions">
                <DocsCommandPalette
                  pages={pages}
                  open={paletteOpen}
                  setOpen={setPaletteOpen}
                  onNavigate={navigateToPage}
                  variant={ctx.isMobile() ? 'mobile' : 'desktop'}
                />
                <Button
                  as="a"
                  href="https://github.com/subframe7536/moraine"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="GitHub repository"
                  class="text-muted-foreground hover:text-foreground"
                >
                  <Icon name="i-lucide-github" />
                </Button>
                <Switch
                  size="sm"
                  label="Toggle color theme"
                  classes={{ wrapper: 'sr-only' }}
                  checked={theme() === 'dark'}
                  onChange={(next) => updateTheme(next ? 'dark' : 'light')}
                  checkedIcon="i-lucide-moon"
                  uncheckedIcon="i-lucide-sun"
                />
              </div>
            </header>

            <main id="main-content" tabindex="-1" class="min-w-0" data-docs-main>
              <Suspense fallback={<div class="px-5 py-8 min-h-screen sm:px-8" />}>
                {props.children}
              </Suspense>
            </main>
          </>
        )}
        scrollThreshold={4}
      />
    </>
  )
}

export default createRoute({
  component: (props) => (
    <MDXProvider components={DOCS_MDX_COMPONENTS}>
      <DocsAppLayout>{props.children}</DocsAppLayout>
    </MDXProvider>
  ),
})
