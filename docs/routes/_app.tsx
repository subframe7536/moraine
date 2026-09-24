import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { JSX } from 'solid-js'
import { Show, Suspense, createEffect, createMemo, createSignal, on, untrack } from 'solid-js'

import { Button, MoraineProvider, Progress, SidebarFrame, cn, useSidebarFrame } from '../../src'

import { PageActions } from './components/layout/page-actions'
import { Sidebar, SidebarHeader } from './components/layout/sidebar'
import { DOCS_MDX_COMPONENTS } from './components/markdown/mdx-components'
import { getDocsPages } from './docs-route'
import { revealHashTarget, useHashScrolling } from './hooks/use-hash-scrolling'
import { useScrollRetention } from './hooks/use-scroll-retention'
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
  const isLanding = createMemo(() => location.pathname === '/')
  let renderedPage = untrack(committedPage)

  createEffect(
    on([activePage, isRouting], ([page, routing]) => {
      if (routing) {
        return
      }

      if (page === renderedPage) {
        return
      }

      renderedPage = page
      mainEl()?.scrollTo({ top: 0 })
      setCommittedPage(page)
    }),
  )

  createEffect(
    on(isRouting, (routing) => {
      if (!routing) {
        setRoutingFromPath(undefined)
        return
      }

      setRoutingFromPath((path) => path ?? untrack(() => location.pathname))
    }),
  )

  const navigateToPage = (key: string) => {
    const path = pages.find((page) => page.key === key)?.path
    if (path) {
      navigate(path)
    }
  }

  useScrollRetention({
    element: mainEl,
    path: () => location.pathname,
  })
  useHashScrolling({
    element: mainEl,
    path: () => location.pathname,
    hash: () => location.hash,
    ready: () => !isRouting() && committedPage() === activePage(),
  })

  function DocsShell() {
    const frame = useSidebarFrame()

    return (
      <>
        <a
          href="#main-content"
          class="z-toast text-foreground px-4 py-2 rounded-md bg-background transition-transform left-1/2 top-2 fixed focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background translate-y-0) -translate-x-1/2 -translate-y-full"
        >
          Skip to main content
        </a>

        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader>
            <SidebarHeader
              onClose={frame.isMobile() ? () => frame.setOpen(false) : undefined}
              isMobile={frame.isMobile()}
            />
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody>
            <Sidebar
              pages={pages}
              activePage={committedPage}
              setActivePage={(key) => {
                navigateToPage(key)
                if (frame.isMobile()) {
                  frame.setOpen(false)
                }
              }}
            />
          </SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>

        <SidebarFrame.Main
          ref={(element) => setMainEl(element)}
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              !(event.target instanceof Element)
            ) {
              return
            }
            const anchor = event.target.closest<HTMLAnchorElement>('a[data-toc-id]')
            const root = event.currentTarget
            if (!anchor || !root.contains(anchor)) {
              return
            }
            requestAnimationFrame(() => {
              const target = root.ownerDocument.getElementById(anchor.dataset.tocId ?? '')
              if (root.isConnected && target && root.contains(target)) {
                revealHashTarget(root, target)
              }
            })
          }}
        >
          <header
            data-scrolled={frame.scrolled() ? '' : undefined}
            class={cn(
              'px-4 bg-transparent flex h-13 transition-([border-color,background-color] duration-200 ease-out) items-center top-0 justify-between sticky z-sticky backdrop-blur-md sm:px-8',
              'data-scrolled:(border-border/60 bg-background/80)',
            )}
          >
            <div class="flex gap-1 min-w-0 items-center">
              <Show when={frame.isMobile()}>
                <SidebarFrame.Trigger
                  as={Button}
                  variant="ghost"
                  size="sm"
                  leading="i-lucide-menu"
                  aria-label="Toggle sidebar"
                />
              </Show>
            </div>
            <PageActions
              pages={pages}
              paletteOpen={paletteOpen}
              setPaletteOpen={setPaletteOpen}
              onNavigate={navigateToPage}
              mobile={frame.isMobile()}
              theme={theme}
              updateTheme={updateTheme}
            />
          </header>

          <main id="main-content" class="min-w-0" data-docs-main>
            <Suspense fallback={<div class="px-5 py-8 min-h-screen sm:px-8" />}>
              {props.children}
            </Suspense>
          </main>
        </SidebarFrame.Main>
      </>
    )
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
      <Show
        when={isLanding()}
        fallback={
          <SidebarFrame classes={{ sidebar: 'border-none' }} scrollThreshold={4}>
            <DocsShell />
          </SidebarFrame>
        }
      >
        <div class="text-foreground bg-background min-h-screen">
          <a
            href="#main-content"
            class="z-toast text-foreground px-4 py-2 rounded-md bg-background left-1/2 top-2 fixed focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background translate-y-0) -translate-x-1/2 -translate-y-full"
          >
            Skip to main content
          </a>
          <header class="border-b border-border/60 bg-background/90 top-0 sticky z-sticky backdrop-blur-md">
            <nav
              aria-label="Main"
              class="mx-auto px-4 flex h-14 max-w-7xl items-center justify-between sm:px-8"
            >
              <div class="flex gap-3 items-center sm:gap-8">
                <a
                  href="/"
                  aria-label="Moraine home"
                  class="font-semibold flex gap-2 items-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
                >
                  <img src="/favicon.svg" alt="" class="size-6" />
                  <span class="hidden sm:inline">Moraine</span>
                </a>
                <a
                  href="/start"
                  class="text-sm text-muted-foreground hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
                >
                  Start
                </a>
                <a
                  href="/styling/unocss"
                  class="text-sm text-muted-foreground hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
                >
                  Styling
                </a>
              </div>
              <PageActions
                pages={pages}
                paletteOpen={paletteOpen}
                setPaletteOpen={setPaletteOpen}
                onNavigate={navigateToPage}
                mobile={true}
                theme={theme}
                updateTheme={updateTheme}
              />
            </nav>
          </header>
          <main id="main-content">
            <Suspense>{props.children}</Suspense>
          </main>
        </div>
      </Show>
    </>
  )
}

export default createRoute({
  component: (props) => (
    <MoraineProvider>
      <MDXProvider components={DOCS_MDX_COMPONENTS}>
        <DocsAppLayout>{props.children}</DocsAppLayout>
      </MDXProvider>
    </MoraineProvider>
  ),
})
