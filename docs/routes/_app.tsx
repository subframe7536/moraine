import { useIsRouting, useLocation, useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { MDXProvider } from 'solid-file-router/mdx'
import type { Accessor, JSX } from 'solid-js'
import {
  Show,
  Suspense,
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  untrack,
} from 'solid-js'

import { Button, Progress, SidebarFrame, SidebarFrameSheetOnlyRender } from '../../src'
import { useTheme } from '../hooks/use-theme'

import { ContentHeader } from './components/layout/content-header'
import { DocsCommandPalette } from './components/layout/docs-command-palette'
import { Sidebar, SidebarHeader } from './components/layout/sidebar'
import { DOCS_MDX_COMPONENTS } from './components/markdown/mdx-components'
import { getDocsPages } from './docs-route'

interface DocsShellRenderContext {
  isMobile: Accessor<boolean>
  sidebarOpen: Accessor<boolean>
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  scrolled: Accessor<boolean>
}

interface DocsShellProps {
  rootRef: (element: HTMLDivElement) => void
  sidebarHeader: (context: DocsShellRenderContext) => JSX.Element
  sidebar: (context: DocsShellRenderContext) => JSX.Element
  main: (context: DocsShellRenderContext) => JSX.Element
}

function DocsShell(props: DocsShellProps) {
  return (
    <SidebarFrame
      ref={props.rootRef}
      frameRender={(ctx) => (
        <Show
          when={ctx.isMobile()}
          fallback={
            <div data-slot="layout" class="flex h-full min-h-0">
              <ctx.sidebar classes="docs-ssr-desktop-sidebar" />
              <ctx.main />
            </div>
          }
        >
          {createComponent(SidebarFrameSheetOnlyRender, ctx)}
        </Show>
      )}
      sidebarHeaderRender={(ctx) =>
        props.sidebarHeader({
          isMobile: ctx.isMobile,
          sidebarOpen: ctx.isOpen,
          setSidebarOpen: ctx.setOpen,
          toggleSidebar: ctx.toggle,
          scrolled: ctx.scrolled,
        })
      }
      sidebarBodyRender={(ctx) =>
        props.sidebar({
          isMobile: ctx.isMobile,
          sidebarOpen: ctx.isOpen,
          setSidebarOpen: ctx.setOpen,
          toggleSidebar: ctx.toggle,
          scrolled: ctx.scrolled,
        })
      }
      mainRender={(ctx) =>
        props.main({
          isMobile: ctx.isMobile,
          sidebarOpen: ctx.isOpen,
          setSidebarOpen: ctx.setOpen,
          toggleSidebar: ctx.toggle,
          scrolled: ctx.scrolled,
        })
      }
      scrollThreshold={4}
    />
  )
}

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
          size="xs"
          class="pointer-events-none inset-x-0 top-0 fixed z-50"
          classes={{
            track: 'rounded-none bg-transparent',
            indicator: 'rounded-none motion-reduce:animate-none',
          }}
        />
      </Show>
      <DocsShell
        rootRef={(element) => {
          rootElement = element
        }}
        sidebarHeader={(ctx) => (
          <SidebarHeader
            onClose={ctx.isMobile() ? () => ctx.setSidebarOpen(false) : undefined}
            isMobile={ctx.isMobile()}
          />
        )}
        sidebar={(ctx) => (
          <Sidebar
            pages={pages}
            activePage={committedPage}
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

export default createRoute({
  component: (props) => (
    <MDXProvider components={DOCS_MDX_COMPONENTS}>
      <DocsAppLayout>{props.children}</DocsAppLayout>
    </MDXProvider>
  ),
})
