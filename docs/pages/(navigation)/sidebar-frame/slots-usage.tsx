import { SidebarFrame } from '@src'

export function SlotsUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-muted/20 h-72 w-full overflow-hidden">
      <SidebarFrame isMobile={false} side="right" variant="inset">
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
            Inspector
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="p-3">Document properties</SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-4">API Architecture RFC.md</SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
