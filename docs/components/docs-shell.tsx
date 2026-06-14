import type { Accessor, JSX } from 'solid-js'

import { SidebarFrame } from '../../src'

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
      renderSidebarHeader={(ctx) =>
        props.sidebarHeader({
          isMobile: ctx.isMobile,
          sidebarOpen: ctx.isOpen,
          setSidebarOpen: ctx.setOpen,
          toggleSidebar: ctx.toggle,
          scrolled: ctx.scrolled,
        })
      }
      renderSidebarBody={(ctx) =>
        props.sidebar({
          isMobile: ctx.isMobile,
          sidebarOpen: ctx.isOpen,
          setSidebarOpen: ctx.setOpen,
          toggleSidebar: ctx.toggle,
          scrolled: ctx.scrolled,
        })
      }
      renderMain={(ctx) =>
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
