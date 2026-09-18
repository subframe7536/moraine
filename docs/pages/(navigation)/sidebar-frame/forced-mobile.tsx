import { Button, SidebarFrame } from '@src'

export function ForcedMobile() {
  return (
    <div class="mx-auto border border-border/70 rounded-xl bg-background h-72 max-w-sm w-full overflow-hidden">
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
            Mobile App
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="p-3">Navigation</SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-4">
          <SidebarFrame.Trigger as={Button} size="sm" variant="outline">
            Open menu
          </SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
