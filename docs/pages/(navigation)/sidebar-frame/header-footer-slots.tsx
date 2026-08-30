import { Avatar, Badge, Button, Icon, SidebarFrame } from '@src'
import { For } from 'solid-js'

const PROJECTS = [
  { name: 'Core Engine v2', status: 'In Progress', icon: 'i-lucide:cpu' },
  { name: 'Mobile App Redesign', status: 'Review', icon: 'i-lucide:smartphone' },
  { name: 'Design Tokens Sync', status: 'Done', icon: 'i-lucide:palette' },
]

export function HeaderFooterSlots() {
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
                <Icon name="i-lucide:box" class="size-3.5" />
              </div>
              <div class="text-xs leading-none min-w-0">
                <p class="text-foreground font-semibold truncate">Acme Projects</p>
                <p class="text-[0.65rem] text-muted-foreground mt-0.5 truncate">Enterprise Plan</p>
              </div>
            </div>
            <Icon
              name="i-lucide:chevrons-up-down"
              class="text-muted-foreground shrink-0 size-3.5"
            />
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="p-2 h-full overflow-y-auto space-y-2">
            <div class="text-[0.68rem] text-muted-foreground tracking-wider font-semibold px-2 uppercase">
              Active Streams
            </div>
            <div class="space-y-0.5">
              <For each={PROJECTS}>
                {(project, index) => (
                  <button
                    type="button"
                    class={`text-xs px-2.5 py-1.5 rounded-md flex w-full transition-colors items-center justify-between ${
                      index() === 0
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div class="flex gap-2 min-w-0 items-center">
                      <Icon name={project.icon} class="shrink-0 size-3.5" />
                      <span class="truncate">{project.name}</span>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2 flex items-center justify-between">
            <div class="flex gap-2 min-w-0 items-center">
              <Avatar text="TC" size="sm" class="text-[0.65rem] rounded-md size-6" />
              <div class="text-xs leading-none min-w-0">
                <p class="text-foreground font-medium truncate">Team Coordinator</p>
                <p class="text-[0.65rem] text-muted-foreground mt-0.5 truncate">team@acme.com</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" class="text-muted-foreground p-0 rounded-md h-6 w-6">
              <Icon name="i-lucide:more-vertical" class="size-3" />
            </Button>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 h-full overflow-y-auto space-y-3">
            <div class="pb-2.5 border-b border-border/50 flex items-center justify-between">
              <div>
                <h4 class="text-sm text-foreground font-semibold">Core Engine v2</h4>
                <p class="text-xs text-muted-foreground">
                  Sprint 14 deliverables & milestone tracking
                </p>
              </div>
              <Badge variant="outline" size="sm" class="rounded-md">
                In Progress
              </Badge>
            </div>

            <div class="gap-2.5 grid grid-cols-2">
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">Tasks Completed</span>
                <p class="text-xs text-foreground font-semibold">18 / 24 Tasks (75%)</p>
              </div>
              <div class="p-2.5 border border-border/60 rounded-lg bg-card/40 space-y-1">
                <span class="text-[0.7rem] text-muted-foreground">Target Release</span>
                <p class="text-xs text-foreground font-semibold">Sep 15, 2026</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
