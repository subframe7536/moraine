import { SidebarFrame } from '@src'

export function ResponsiveUsage() {
  return (
    <div class="b-(1 border) rounded-xl h-64 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        sidebarBodyRender={() => (
          <div class="text-xs p-3 space-y-2">
            <div class="text-foreground font-medium">Navigation</div>
            <div class="text-muted-foreground">Dashboard</div>
            <div class="text-muted-foreground">Analytics</div>
            <div class="text-muted-foreground">Settings</div>
          </div>
        )}
        mainRender={() => (
          <div class="text-xs text-muted-foreground p-4">
            Main content adjusts automatically based on viewport size.
          </div>
        )}
      />
    </div>
  )
}
