import type { Accessor, JSX } from 'solid-js'
import { Show, createComponent } from 'solid-js'

import { SidebarFrame, SidebarFrameSheetOnlyRender } from '../../src'

export interface DocsShellRenderContext {
  isMobile: Accessor<boolean>
  sidebarOpen: Accessor<boolean>
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  scrolled: Accessor<boolean>
}

export interface DocsShellProps {
  sidebarHeader: (context: DocsShellRenderContext) => JSX.Element
  sidebar: (context: DocsShellRenderContext) => JSX.Element
  main: (context: DocsShellRenderContext) => JSX.Element
}

export function DocsShell(props: DocsShellProps) {
  return (
    <SidebarFrame
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
