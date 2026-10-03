import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { JSX } from 'solid-js'
import {
  Show,
  Suspense,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
  untrack,
} from 'solid-js'

import { Button, MoraineProvider, Progress, SidebarFrame, useSidebarFrame } from '../../src'
import { createMediaQuery } from '../../src/utils'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../shared/docs-focus.class'
import { DOCS_MOBILE_QUERY } from '../shared/docs-layout'

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
  const isMobile = createMediaQuery(DOCS_MOBILE_QUERY)
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
    const [mobileSidebarReady, setMobileSidebarReady] = createSignal(false)

    onMount(() => {
      // SidebarFrame resolves its media query in a microtask. Mount the mobile Sheet only
      // after its open state has caught up, so hydration cannot play a closing animation.
      queueMicrotask(() => setMobileSidebarReady(true))
    })

    createEffect(
      on(
        () => location.pathname,
        () => {
          if (frame.isMobile()) {
            frame.setOpen(false)
          }
        },
      ),
    )

    return (
      <>
        <a
          href="#main-content"
          class={`z-toast text-foreground px-4 py-2 bg-background transition-transform left-1/2 top-2 fixed rounded-md ${DOCS_FOCUS_RING_OFFSET_CLASS} -translate-x-1/2 -translate-y-full focus-visible:translate-y-0`}
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

        <div class="flex flex-1 min-h-0 w-full overflow-hidden">
          <Show
            when={(!isLanding() || frame.isMobile()) && (!frame.isMobile() || mobileSidebarReady())}
          >
            <SidebarFrame.Sidebar data-docs-sidebar class="border-r-0 bg-background">
              <Show when={frame.isMobile()}>
                <SidebarFrame.SidebarHeader class="p-0 shrink-0">
                  <SidebarHeader />
                </SidebarFrame.SidebarHeader>
              </Show>
              <SidebarFrame.SidebarBody class="overscroll-contain">
                <Sidebar pages={pages} activePage={committedPage} />
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
                    class="min-h-11 w-full justify-start"
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
      <SidebarFrame
        isMobile={isMobile()}
        class="flex-col overflow-hidden h-dvh max-h-dvh"
        scrollThreshold={4}
      >
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
