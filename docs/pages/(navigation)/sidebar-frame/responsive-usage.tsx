import { Button, Icon, SidebarFrame, useSidebarFrame } from '@src'

function ResponsiveLayout() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader class="p-3 border-b border-border/60">
          DevStudio
        </SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody class="p-2">Workspace navigation</SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main>
        <header class="p-3 border-b border-border/50 flex items-center">
          <Button variant="ghost" size="sm" aria-label="Toggle sidebar" onClick={frame.toggle}>
            <Icon name="i-lucide:menu" />
          </Button>
          <span class="text-sm font-semibold">Workspace Overview</span>
        </header>
      </SidebarFrame.Main>
    </>
  )
}

export function ResponsiveUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame>
        <ResponsiveLayout />
      </SidebarFrame>
    </div>
  )
}
