import { SidebarFrame } from '@src'

export function FrameRender() {
  return (
    <div class="border border-border/70 rounded-xl bg-background flex flex-col h-72 w-full overflow-hidden">
      <header class="px-4 border-b border-border/70 bg-card/60 flex shrink-0 h-11 items-center justify-between">
        <span class="text-xs font-semibold">Cloud Console</span>
        <span class="text-xs text-muted-foreground">Production</span>
      </header>
      <SidebarFrame isMobile={false} class="flex-1">
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarBody class="p-2">
            <nav class="text-xs flex flex-col gap-1">
              <span class="text-foreground font-medium px-2.5 py-1.5 rounded-md bg-muted">
                Clusters
              </span>
              <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted/50">
                Networking
              </span>
              <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted/50">
                Storage
              </span>
            </nav>
          </SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-4">
          <h3 class="text-sm font-semibold">Active Compute Clusters</h3>
          <p class="text-xs text-muted-foreground mt-1">3 clusters operational in us-east-1.</p>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
