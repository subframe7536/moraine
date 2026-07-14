import { useLocation, useNavigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal } from 'solid-js'

import { Button } from '../../src'
import { useTheme } from '../hooks/use-theme'

import { ContentHeader } from './content-header'
import { DocsCommandPalette, DocsSearchTrigger } from './docs-command-palette'
import { DocsPageMeta } from './docs-page-meta'
import { getDocsPages } from './docs-route'
import { DocsShell } from './docs-shell'
import { Sidebar, SidebarHeader } from './sidebar'

export function DocsAppLayout(props: { children?: JSX.Element }): JSX.Element {
  const pages = getDocsPages()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, updateTheme } = useTheme()
  const [paletteOpen, setPaletteOpen] = createSignal(false)

  const activePage = createMemo(() => {
    const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/g, '')
    return pages.find((page) => page.path === normalizedPath)?.key ?? pages[0]?.key ?? ''
  })

  const pageTitle = createMemo(() => pages.find((page) => page.key === activePage())?.label ?? '')
  const activePageEntry = createMemo(() => pages.find((page) => page.key === activePage()))

  const navigateToPage = (key: string) => {
    const path = pages.find((page) => page.key === key)?.path
    if (path) {
      navigate(path)
    }
  }

  return (
    <>
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
                <DocsSearchTrigger
                  variant={ctx.isMobile() ? 'mobile' : 'desktop'}
                  onOpen={() => setPaletteOpen(true)}
                />
              }
            />
            {props.children}
          </>
        )}
      />
      <DocsCommandPalette
        pages={pages}
        open={paletteOpen}
        setOpen={setPaletteOpen}
        onNavigate={navigateToPage}
      />
    </>
  )
}
