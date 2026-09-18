import { Button, Icon, SidebarFrame } from '@src'

export function ResponsiveUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame>
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
            DevStudio
          </SidebarFrame.SidebarHeader>
          <SidebarFrame.SidebarBody class="p-2">Workspace navigation</SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <header class="p-3 border-b border-border/50 flex gap-2 items-center">
            <SidebarFrame.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle sidebar"
            >
              <Icon name="i-lucide:menu" />
            </SidebarFrame.Trigger>
            <span class="text-sm font-semibold">Workspace Overview</span>
          </header>
        </SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
