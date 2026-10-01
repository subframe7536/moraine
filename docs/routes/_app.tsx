import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { JSX } from 'solid-js'
import { Show, Suspense, createEffect, createMemo, createSignal, on, untrack } from 'solid-js'

import { Button, MoraineProvider, Progress, SidebarFrame, useSidebarFrame } from '../../src'

import { DocsHeader, Sidebar, SidebarHeader } from './components/layout'
import { DOCS_MDX_COMPONENTS } from './components/markdown'
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
    return pages.find((page) => page.path === normalizedPath)?.path ?? ''
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

  const navigateToPage = (pagePath: string) => {
    const path = pages.find((page) => page.path === pagePath)?.path
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
          class="z-toast text-foreground px-4 py-2 bg-background transition-transform left-1/2 top-2 fixed rounded-md focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background translate-y-0) -translate-x-1/2 -translate-y-full"
        >
          Skip to main content
        </a>

        <DocsHeader
          pages={pages}
          paletteOpen={paletteOpen}
          setPaletteOpen={setPaletteOpen}
          onNavigate={navigateToPage}
          theme={theme}
          updateTheme={updateTheme}
        />

        <div class="flex flex-1 min-h-0 overflow-hidden">
          <Show when={!isLanding() || frame.isMobile()}>
            <SidebarFrame.Sidebar class="border-r-0 bg-background">
              <Show when={frame.isMobile()}>
                <SidebarFrame.SidebarHeader>
                  <SidebarHeader onClose={() => frame.setOpen(false)} isMobile={true} />
                </SidebarFrame.SidebarHeader>
              </Show>
              <SidebarFrame.SidebarBody>
                <Sidebar
                  pages={pages.filter((page) =>
                    location.pathname.startsWith('/components')
                      ? page.surface === 'components'
                      : page.surface === 'docs',
                  )}
                  activePage={committedPage}
                  setActivePage={(pagePath) => {
                    navigateToPage(pagePath)
                    if (frame.isMobile()) {
                      frame.setOpen(false)
                    }
                  }}
                />
              </SidebarFrame.SidebarBody>
              <Show when={frame.isMobile()}>
                <SidebarFrame.SidebarFooter class="px-5 pb-5 pt-3">
                  <Button
                    as="a"
                    href="https://github.com/subframe7536/moraine"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="sm"
                    leading="i-lucide:github"
                    class="w-full justify-start"
                  >
                    GitHub repository
                  </Button>
                </SidebarFrame.SidebarFooter>
              </Show>
            </SidebarFrame.Sidebar>
          </Show>

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
            <main id="main-content" class="min-w-0" data-docs-main>
              <Suspense fallback={<div class="px-5 py-8 min-h-screen sm:px-8" />}>
                {props.children}
              </Suspense>
            </main>
          </SidebarFrame.Main>
        </div>
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
      <SidebarFrame class="flex-col h-screen max-h-screen overflow-hidden" scrollThreshold={4}>
        <DocsShell />
      </SidebarFrame>
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
