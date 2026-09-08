import { Button, Icon, SidebarFrame, useSidebarFrame } from '@src'

function ResponsiveLayout() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader class="text-sm font-semibold p-3 border-b border-border/60">
          DevStudio
        </SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody class="p-2">
          <nav class="text-xs flex flex-col gap-1">
            <span class="text-accent-foreground font-medium px-2.5 py-1.5 rounded-md bg-accent">
              Overview
            </span>
            <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted">
              Deployments
            </span>
            <span class="text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted">
              Settings
            </span>
          </nav>
        </SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main>
        <header class="p-3 border-b border-border/50 flex gap-2 items-center">
          <Button variant="ghost" size="sm" aria-label="Toggle sidebar" onClick={frame.toggle}>
            <Icon name="i-lucide:menu" />
          </Button>
          <span class="text-sm font-semibold">Workspace Overview</span>
        </header>
        <div class="text-xs text-muted-foreground p-4">
          Click the menu icon to toggle the sidebar, or resize to mobile to see it open inside a
          Sheet.
        </div>
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
