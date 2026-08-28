import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'

export function ResponsiveUsage() {
  return (
    <div class="b-(1 border) rounded-xl bg-background h-72 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        sidebarHeaderRender={() => (
          <div class="p-3 b-b-(1 border) flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <Icon name="i-lucide:layers" class="text-primary size-4" />
              <span class="text-xs text-foreground font-semibold">DevStudio</span>
            </div>
            <Badge variant="outline" size="sm">
              v1.0
            </Badge>
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="text-xs p-2 space-y-1">
            <button class="text-primary font-medium px-2.5 py-1.5 rounded-lg bg-primary/10 flex gap-2 w-full items-center">
              <Icon name="i-lucide:layout-dashboard" class="size-3.5" />
              <span>Overview</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-lg flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:folder-kanban" class="size-3.5" />
              <span>Projects</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-lg flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:settings" class="size-3.5" />
              <span>Settings</span>
            </button>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2.5 b-t-(1 border) flex gap-2 items-center">
            <Avatar text="AM" size="sm" />
            <div class="text-xs leading-tight">
              <p class="text-foreground font-medium">Alex Morgan</p>
              <p class="text-[0.7rem] text-muted-foreground">Admin</p>
            </div>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 space-y-3">
            <h4 class="text-sm text-foreground font-semibold">Workspace Overview</h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Main content viewport adjusts layout automatically across desktop and mobile.
            </p>
            <Button size="sm" variant="outline" leading="i-lucide:plus">
              Create New Cluster
            </Button>
          </div>
        )}
      />
    </div>
  )
}
