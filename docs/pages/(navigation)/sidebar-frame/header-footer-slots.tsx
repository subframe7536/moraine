import { Avatar, SidebarFrame } from '@src'

export function HeaderFooterSlots() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
            Acme Projects
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="p-3">Core Engine v2</SidebarFrame.SidebarBody>
          <SidebarFrame.SidebarFooter class="p-3 border-t border-border/60 gap-2 items-center">
            <Avatar text="TC" size="sm" />
            Team Coordinator
          </SidebarFrame.SidebarFooter>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-4">Project details</SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
