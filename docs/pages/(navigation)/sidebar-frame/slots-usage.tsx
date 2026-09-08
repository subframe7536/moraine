import { SidebarFrame } from '@src'

export function SlotsUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame isMobile={false} side="right" variant="inset">
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="text-sm font-semibold p-3 border-b border-border/60">
            Inspector
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="text-xs text-muted-foreground p-3">
            Document properties and schema metadata.
          </SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-5">
          <h3 class="text-sm font-semibold">API Architecture RFC.md</h3>
          <p class="text-xs text-muted-foreground mt-1">Right-aligned inset sidebar variant.</p>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
