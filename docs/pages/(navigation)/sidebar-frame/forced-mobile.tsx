import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'

export function ForcedMobile() {
  return (
    <div class="mx-auto border border-border/70 rounded-xl bg-background h-72 max-w-sm w-full shadow-xs relative overflow-hidden">
      <SidebarFrame
        isMobile
        classes={{
          sidebarHeader: 'border-b border-border/60',
          sidebarFooter: 'border-t border-border/60',
        }}
        sidebarHeaderRender={(ctx) => (
          <div class="p-3 flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <div class="text-primary rounded-md bg-primary/10 flex size-6 items-center justify-center">
                <Icon name="i-lucide:sparkles" class="size-3.5" />
              </div>
              <span class="text-xs text-foreground font-semibold">Mobile App</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              class="p-0 rounded-md h-7 w-7"
              onClick={() => ctx.setOpen(false)}
            >
              <Icon name="i-lucide:x" class="size-3.5" />
            </Button>
          </div>
        )}
        sidebarBodyRender={(ctx) => (
          <div class="text-xs p-2 h-full overflow-y-auto space-y-1">
            <button
              onClick={() => ctx.setOpen(false)}
              class="text-primary font-medium px-2.5 py-2 rounded-md bg-primary/10 flex gap-2.5 w-full items-center"
            >
              <Icon name="i-lucide:home" class="size-4" />
              <span>Feed & Activity</span>
            </button>
            <button
              onClick={() => ctx.setOpen(false)}
              class="text-muted-foreground px-2.5 py-2 rounded-md flex gap-2.5 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40"
            >
              <Icon name="i-lucide:bell" class="size-4" />
              <span>Notifications</span>
              <Badge variant="default" size="sm" class="ml-auto rounded-md">
                3
              </Badge>
            </button>
            <button
              onClick={() => ctx.setOpen(false)}
              class="text-muted-foreground px-2.5 py-2 rounded-md flex gap-2.5 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40"
            >
              <Icon name="i-lucide:bookmark" class="size-4" />
              <span>Saved Items</span>
            </button>
            <button
              onClick={() => ctx.setOpen(false)}
              class="text-muted-foreground px-2.5 py-2 rounded-md flex gap-2.5 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40"
            >
              <Icon name="i-lucide:settings" class="size-4" />
              <span>Settings</span>
            </button>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2.5 flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <Avatar text="MB" size="sm" class="text-[0.65rem] rounded-md size-6" />
              <div class="text-xs">
                <p class="text-foreground font-medium">Mobile User</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" class="text-muted-foreground p-0 rounded-md h-7 w-7">
              <Icon name="i-lucide:log-out" class="size-3.5" />
            </Button>
          </div>
        )}
        mainRender={(ctx) => (
          <div class="p-3.5 flex flex-col gap-3 h-full overflow-y-auto">
            {/* Mobile Header Bar */}
            <div class="pb-2 border-b border-border/50 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                class="text-xs px-2 rounded-md h-7"
                onClick={ctx.toggle}
              >
                <Icon name="i-lucide:menu" class="mr-1.5 size-3.5" />
                <span>Menu</span>
              </Button>
              <span class="text-xs text-foreground font-semibold">Activity Feed</span>
              <div class="text-muted-foreground rounded-md bg-muted/40 flex size-7 items-center justify-center">
                <Icon name="i-lucide:bell" class="size-3.5" />
              </div>
            </div>

            {/* Mobile Cards Feed */}
            <div class="space-y-2">
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-foreground font-medium">Deployment Successful</span>
                  <span class="text-[0.65rem] text-muted-foreground font-mono">2m ago</span>
                </div>
                <p class="text-[0.7rem] text-muted-foreground">
                  Edge cluster v1.4 successfully published to all 24 regional points of presence.
                </p>
              </div>
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-foreground font-medium">Security Alert</span>
                  <Badge variant="outline" size="sm" class="text-[0.65rem] rounded-md">
                    Resolved
                  </Badge>
                </div>
                <p class="text-[0.7rem] text-muted-foreground">
                  Automatic certificate renewal completed.
                </p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
