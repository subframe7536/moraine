import { SidebarFrame } from '@src'

export function FrameRender() {
  return (
    <div class="border border-border/70 rounded-xl bg-background flex flex-col h-72 w-full overflow-hidden">
      <header class="px-4 border-b border-border/70 bg-card/60 flex shrink-0 h-11 items-center">
        <span class="text-xs font-semibold">Cloud Console</span>
      </header>
      <SidebarFrame isMobile={false} class="flex-1 h-auto">
        <SidebarFrame.Sidebar>
          <SidebarFrame.SidebarBody class="p-3">Cluster navigation</SidebarFrame.SidebarBody>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main class="p-4">Active compute clusters</SidebarFrame.Main>
      </SidebarFrame>
    </div>
  )
}
