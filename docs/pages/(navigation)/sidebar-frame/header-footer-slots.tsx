import { Avatar, SidebarFrame } from '@src'

export function HeaderFooterSlots() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="text-sm font-semibold p-3 border-b border-border/60">
            Acme Projects
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="p-2">
            <nav class="text-xs flex flex-col gap-1">
              <span class="text-foreground font-medium px-2.5 py-1.5 rounded-md bg-muted">
                Core Engine v2
              </span>
              <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted/50">
                Analytics SDK
              </span>
              <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted/50">
                Design System
              </span>
            </nav>
          </SidebarFrame.SidebarBody>
          <SidebarFrame.SidebarFooter class="text-xs p-3 border-t border-border/60 gap-2 items-center">
            <Avatar text="TC" size="sm" />
            <div class="flex flex-col min-w-0">
              <span class="text-foreground font-medium truncate">Taylor Clark</span>
              <span class="text-muted-foreground truncate">taylor@acme.com</span>
            </div>
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-5">
          <h3 class="text-sm font-semibold">Project Details</h3>
          <p class="text-xs text-muted-foreground mt-1">
            Select a repository from the sidebar to inspect active branches and build pipelines.
          </p>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
