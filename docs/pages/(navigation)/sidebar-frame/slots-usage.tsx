import { Avatar, SidebarFrame } from '@src'

export function SlotsUsage() {
  return (
    <div class="b-(1 border) rounded-xl h-72 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        sidebarHeaderRender={() => (
          <div class="text-xs text-foreground font-semibold p-3 b-b-(1 border)">Moraine Studio</div>
        )}
        sidebarBodyRender={() => (
          <div class="text-xs p-3 space-y-2">
            <div class="text-muted-foreground">Projects</div>
            <div class="text-muted-foreground">Deployments</div>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-3 b-t-(1 border) flex gap-2 items-center">
            <Avatar text="JD" />
            <div class="text-xs">
              <p class="font-medium">Jane Doe</p>
              <p class="text-muted-foreground">Admin</p>
            </div>
          </div>
        )}
        mainRender={() => (
          <div class="text-xs text-muted-foreground p-4">
            Workspace dashboard layout with dedicated header and footer slots.
          </div>
        )}
      />
    </div>
  )
}
