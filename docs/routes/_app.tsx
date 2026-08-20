import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { JSX } from 'solid-js'
import { Show, Suspense, createEffect, createMemo, createSignal, untrack } from 'solid-js'

import { Button, Icon, Progress, SidebarFrame, Switch, cn } from '../../src/index.ts'

import { DocsCommandPalette } from './components/layout/docs-command-palette.tsx'
import { Sidebar, SidebarHeader } from './components/layout/sidebar.tsx'
import { DOCS_MDX_COMPONENTS } from './components/markdown/mdx-components.tsx'
import { getDocsPages } from './docs-route.ts'
import { useTheme } from './hooks/use-theme.ts'

function DocsAppLayout(props: { children?: JSX.Element }): JSX.Element {
  const pages = getDocsPages()
  const location = useLocation()
  const navigate = useNavigate()
  const isRouting = useIsRouting()
  const { theme, updateTheme } = useTheme()
  const [paletteOpen, setPaletteOpen] = createSignal(false)
  const [routingFromPath, setRoutingFromPath] = createSignal<string>()

  const activePage = createMemo(() => {
    const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/g, '')
    return pages.find((page) => page.path === normalizedPath)?.key ?? pages[0]?.key ?? ''
  })

  const [committedPage, setCommittedPage] = createSignal(untrack(activePage))
  const pageTitle = createMemo(
    () => pages.find((page) => page.key === committedPage())?.label ?? '',
  )
  const navigationLoading = createMemo(() => isRouting() && location.pathname === routingFromPath())
  let rootElement: HTMLDivElement | undefined
  let renderedPage = untrack(committedPage)

  const resetMainScroll = () => {
    const mainElement = rootElement?.querySelector<HTMLElement>('[data-slot="main"]')
    if (mainElement) {
      const scrollBehavior = mainElement.style.scrollBehavior
      mainElement.style.scrollBehavior = 'auto'
      mainElement.scrollTop = 0
      mainElement.style.scrollBehavior = scrollBehavior
    }
  }

  createEffect(() => {
    const page = activePage()
    if (isRouting()) {
      return
    }

    if (page === renderedPage) {
      return
    }

    renderedPage = page
    setCommittedPage(page)
    resetMainScroll()
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
          class="pointer-events-none inset-x-0 top-0 fixed z-50"
          classes={{
            track: 'rounded-none bg-transparent',
            indicator: 'rounded-none motion-reduce:animate-none',
          }}
        />
      </Show>
      <SidebarFrame
        ref={(element) => {
          rootElement = element
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
            <header
              data-scrolled={ctx.scrolled() ? '' : undefined}
              class={cn(
                'px-4 b-(b transparent) bg-transparent flex h-13 transition-([border-color,box-shadow,background-color] duration-200 ease-out) items-center top-0 justify-between sticky z-10 backdrop-blur-md sm:px-8',
                'data-scrolled:(border-border/80 bg-background/90 shadow-xs)',
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
                <span
                  class={cn(
                    'text-sm text-foreground font-semibold truncate transition-([opacity,transform] duration-200) lg:text-lg',
                    ctx.scrolled()
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 pointer-events-none translate-y-2',
                  )}
                >
                  {pageTitle()}
                </span>
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

            <Suspense fallback={<main class="px-5 py-8 min-h-screen" />}>{props.children}</Suspense>
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
