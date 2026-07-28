import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Show, Suspense, createEffect, createMemo, createSignal, onMount, untrack } from 'solid-js'

import { Button, Progress } from '../../src'
import { useTheme } from '../hooks/use-theme'

import { ContentHeader } from './content-header'
import { DocsCommandPalette } from './docs-command-palette'
import { DocsPageMeta } from './docs-page-meta'
import { getDocsPages } from './docs-route'
import {
  docsPageLoadingFromPath,
  isDocsPageLoading,
  markDocsNavigationReady,
} from './docs-route-loading'
import { DocsShell } from './docs-shell'
import { Sidebar, SidebarHeader } from './sidebar'

export function DocsAppLayout(props: { children?: JSX.Element }): JSX.Element {
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

  const pageTitle = createMemo(() => pages.find((page) => page.key === activePage())?.label ?? '')
  const activePageEntry = createMemo(() => pages.find((page) => page.key === activePage()))
  const navigationLoading = createMemo(
    () =>
      (isRouting() && location.pathname === routingFromPath()) ||
      (isDocsPageLoading() && location.pathname === docsPageLoadingFromPath()),
  )

  createEffect(() => {
    if (!isRouting()) {
      setRoutingFromPath(undefined)
      return
    }

    setRoutingFromPath((path) => path ?? untrack(() => location.pathname))
  })

  onMount(markDocsNavigationReady)

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
          size="xs"
          class="pointer-events-none inset-x-0 top-0 fixed z-50"
          classes={{
            track: 'rounded-none bg-transparent',
            indicator: 'rounded-none motion-reduce:animate-none',
          }}
        />
      </Show>
      <DocsPageMeta page={activePageEntry()} />
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
            activePage={activePage}
            setActivePage={(key) => {
              navigateToPage(key)
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
                <DocsCommandPalette
                  pages={pages}
                  open={paletteOpen}
                  setOpen={setPaletteOpen}
                  onNavigate={navigateToPage}
                  variant={ctx.isMobile() ? 'mobile' : 'desktop'}
                />
              }
            />
            <Suspense fallback={<main class="px-5 py-8 min-h-screen" />}>{props.children}</Suspense>
          </>
        )}
      />
    </>
  )
}
