import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'

export function SlotsUsage() {
  return (
    <div class="border border-border/70 rounded-xl bg-muted/20 h-72 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        side="right"
        variant="inset"
        classes={{
          sidebarHeader: 'border-b border-border/60',
          sidebarFooter: 'border-t border-border/60',
        }}
        sidebarHeaderRender={() => (
          <div class="p-2.5 flex items-center justify-between">
            <span class="text-xs text-foreground font-semibold flex gap-1.5 items-center">
              <Icon name="i-lucide:sliders" class="text-muted-foreground size-3.5" />
              <span>Inspector</span>
            </span>
            <Badge variant="outline" size="sm" class="rounded-md">
              Draft
            </Badge>
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="text-xs p-3 h-full overflow-y-auto space-y-3">
            <div class="space-y-1">
              <label class="text-[0.7rem] text-muted-foreground tracking-wider font-semibold uppercase">
                Owner
              </label>
              <div class="pt-0.5 flex gap-2 items-center">
                <Avatar text="JD" size="sm" class="text-[0.65rem] rounded-md size-6" />
                <span class="text-xs text-foreground font-medium">Jane Doe</span>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[0.7rem] text-muted-foreground tracking-wider font-semibold uppercase">
                Visibility
              </label>
              <p class="text-xs text-foreground font-medium flex gap-1.5 items-center">
                <Icon name="i-lucide:lock" class="text-muted-foreground size-3" />
                <span>Internal Team</span>
              </p>
            </div>

            <div class="space-y-1">
              <label class="text-[0.7rem] text-muted-foreground tracking-wider font-semibold uppercase">
                Updated
              </label>
              <p class="text-xs text-muted-foreground font-mono">10 mins ago</p>
            </div>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              class="text-xs rounded-md w-full"
              leading="i-lucide:download"
            >
              Export
            </Button>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 h-full overflow-y-auto space-y-3">
            <div class="pb-2 border-b border-border/40 flex items-center justify-between">
              <h4 class="text-sm text-foreground font-semibold">API Architecture RFC.md</h4>
              <Badge variant="outline" size="sm" class="rounded-md">
                v2.4
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              This RFC specifies the next generation data streaming protocol and real-time schema
              validation across distributed services.
            </p>
            <div class="text-[0.72rem] text-muted-foreground font-mono p-2.5 border border-border/50 rounded-md bg-muted/30 space-y-1">
              <p class="text-foreground font-semibold"># Proposed Pipeline</p>
              <p>+ const stream = createDataStream(&#123; channel: 'events' &#125;)</p>
            </div>
          </div>
        )}
      />
    </div>
  )
}
