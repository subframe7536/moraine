import { Badge, Button, Icon, SidebarFrame } from '@src'
import type { SidebarFrameT } from '@src'

export interface SidebarFramePlaygroundProps {
  variant?: SidebarFrameT.Variant['variant']
  side?: 'left' | 'right'
}

export function SidebarFramePlayground(props: SidebarFramePlaygroundProps) {
  return (
    <div class="border border-border/60 rounded-2xl bg-background h-72 max-w-2xl w-full relative overflow-hidden">
      <SidebarFrame
        variant={props.variant ?? 'default'}
        side={props.side ?? 'left'}
        sidebarHeaderRender={() => (
          <div class="p-3 border-b border-border/50 flex gap-2 items-center">
            <Icon name="i-lucide:layers" class="text-primary size-4" />
            <span class="text-xs text-foreground font-semibold">Workspace</span>
            <Badge variant="outline" size="sm" class="ml-auto">
              Pro
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
        mainRender={() => (
          <div class="p-4 space-y-3">
            <h4 class="text-sm text-foreground font-semibold">Dashboard Analytics</h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Responsive sidebar shell with collapsible panels and mobile drawer integration.
            </p>
            <Button size="sm" variant="outline" leading="i-lucide:plus">
              New Project
            </Button>
          </div>
        )}
      />
    </div>
  )
}
