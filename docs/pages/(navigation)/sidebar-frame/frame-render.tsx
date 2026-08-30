import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'
import type { SidebarFrameT } from '@src'

/**
 * Custom frame renderer providing a full-width top app header
 * above a split desktop layout.
 */
function CustomTopBarFrameRender(ctx: SidebarFrameT.FrameContext) {
  return (
    <div class="flex flex-col h-full min-h-0 w-full">
      {/* Top Application Header */}
      <header class="px-3.5 border-b border-border/70 bg-card/60 flex shrink-0 h-11 items-center justify-between">
        <div class="flex gap-2.5 items-center">
          <div class="text-primary rounded-md bg-primary/10 flex size-6 items-center justify-center">
            <Icon name="i-lucide:sparkles" class="size-3.5" />
          </div>
          <span class="text-xs text-foreground font-semibold">Cloud Console</span>
          <Badge variant="outline" size="sm" class="rounded-md">
            Custom Frame
          </Badge>
        </div>
        <div class="flex gap-2 items-center">
          <Button
            size="sm"
            variant="ghost"
            class="text-xs text-muted-foreground h-7 hover:text-foreground"
            leading={ctx.isOpen() ? 'i-lucide:panel-left-close' : 'i-lucide:panel-left-open'}
            onClick={ctx.toggle}
          >
            {ctx.isOpen() ? 'Hide Sidebar' : 'Show Sidebar'}
          </Button>
          <Avatar text="CC" size="sm" class="text-[0.65rem] rounded-md size-6" />
        </div>
      </header>

      {/* Split Body Container */}
      <div class="flex flex-1 min-h-0 overflow-hidden">
        <ctx.sidebar
          classes={[
            'transition-[width,opacity,transform] duration-200 ease-out border-r border-border/70',
            ctx.isOpen()
              ? 'opacity-100 translate-x-0 w-52'
              : 'opacity-0 w-0 pointer-events-none -translate-x-2',
          ]}
        />
        <ctx.main class="bg-background/50 flex-1 overflow-y-auto" />
      </div>
    </div>
  )
}

export function FrameRender() {
  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full relative overflow-hidden">
      <SidebarFrame
        isMobile={false}
        frameRender={CustomTopBarFrameRender}
        sidebarHeaderRender={() => (
          <div class="text-xs text-muted-foreground font-medium p-2.5 border-b border-border/60">
            Navigation
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="text-xs p-2 space-y-1">
            <button class="text-primary font-medium px-2.5 py-1.5 rounded-md bg-primary/10 flex gap-2 w-full items-center">
              <Icon name="i-lucide:layout-grid" class="size-3.5" />
              <span>Clusters</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-md flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:database" class="size-3.5" />
              <span>Databases</span>
            </button>
            <button class="text-muted-foreground px-2.5 py-1.5 rounded-md flex gap-2 w-full transition-colors items-center hover:text-foreground hover:bg-muted/40">
              <Icon name="i-lucide:shield" class="size-3.5" />
              <span>Security</span>
            </button>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm text-foreground font-semibold">Active Compute Clusters</h4>
                <p class="text-xs text-muted-foreground">
                  Custom frame renderer integrates global header with collapsible side rail.
                </p>
              </div>
              <Button size="sm" variant="outline" class="rounded-md" leading="i-lucide:plus">
                New Cluster
              </Button>
            </div>
            <div class="pt-1 gap-2.5 grid grid-cols-2">
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">Production US-East</span>
                <p class="text-xs text-foreground font-semibold">8 Nodes Online</p>
              </div>
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">Staging EU-Central</span>
                <p class="text-xs text-foreground font-semibold">2 Nodes Online</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
