import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'

export function ResponsiveUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        classes={{
          sidebarHeader: 'border-b border-border/60',
          sidebarFooter: 'border-t border-border/60',
        }}
        sidebarHeaderRender={() => (
          <div class="p-2.5 flex items-center justify-between">
            <div class="flex gap-2 min-w-0 items-center">
              <div class="text-primary rounded-md bg-primary/10 flex shrink-0 size-6 items-center justify-center">
                <Icon name="i-lucide:layers" class="size-3.5" />
              </div>
              <span class="text-xs text-foreground font-semibold truncate">DevStudio</span>
            </div>
            <Badge variant="outline" size="sm" class="rounded-md">
              v1.0
            </Badge>
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="text-xs p-1.5 space-y-0.5">
            <button class="text-primary font-medium px-2.5 py-1.5 rounded-md bg-primary/10 flex gap-2 w-full items-center">
              <Icon name="i-lucide:layout-dashboard" class="shrink-0 size-3.5" />
              <span class="truncate">Overview</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-md flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:folder-kanban" class="shrink-0 size-3.5" />
              <span class="truncate">Projects</span>
              <span class="text-[0.65rem] text-muted-foreground font-mono ml-auto px-1.5 py-0.2 rounded-md bg-muted">
                8
              </span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-md flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:rocket" class="shrink-0 size-3.5" />
              <span class="truncate">Deployments</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-md flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:settings" class="shrink-0 size-3.5" />
              <span class="truncate">Settings</span>
            </button>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2 flex gap-2 items-center">
            <Avatar text="AM" size="sm" class="text-[0.65rem] rounded-md size-6" />
            <div class="text-xs leading-tight min-w-0">
              <p class="text-foreground font-medium truncate">Alex Morgan</p>
              <p class="text-[0.68rem] text-muted-foreground truncate">alex@company.com</p>
            </div>
          </div>
        )}
        mainRender={(ctx) => (
          <div class="p-4 h-full overflow-y-auto space-y-3">
            <div class="pb-2.5 border-b border-border/50 flex items-center justify-between">
              <div class="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-xs text-muted-foreground px-1.5 h-7 hover:text-foreground"
                  onClick={ctx.toggle}
                >
                  <Icon name="i-lucide:menu" class="size-3.5" />
                </Button>
                <span class="text-xs text-muted-foreground">/</span>
                <span class="text-xs text-foreground font-medium">Workspace Overview</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                class="text-xs rounded-md h-7"
                leading="i-lucide:plus"
              >
                Deploy
              </Button>
            </div>

            <div class="gap-2.5 grid grid-cols-2">
              <div class="p-3 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">Active Clusters</span>
                <p class="text-sm text-foreground font-semibold">12 Running</p>
              </div>
              <div class="p-3 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">System Health</span>
                <p class="text-sm text-primary font-semibold">99.9% Uptime</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
