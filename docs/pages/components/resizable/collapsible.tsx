import { Button, Icon, Resizable } from '@src'
import { For, createSignal, Show } from 'solid-js'

const NAV_ITEMS = [
  { icon: 'i-lucide:layout-dashboard', label: 'Dashboard', badge: '3' },
  { icon: 'i-lucide:folder-git-2', label: 'Repositories' },
  { icon: 'i-lucide:activity', label: 'Deployments', badge: 'Live' },
  { icon: 'i-lucide:settings', label: 'Settings' },
]

export function Collapsible() {
  const [collapsed, setCollapsed] = createSignal(false)
  const [pixelSize, setPixelSize] = createSignal(220)

  return (
    <div class="space-y-3">
      <div class="text-xs flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCollapsed((prev) => !prev)}
            leading={collapsed() ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
          >
            {collapsed() ? 'Expand sidebar' : 'Collapse sidebar'}
          </Button>
          <span class="text-muted-foreground">Click the handle grip or shortcut button</span>
        </div>
        <span class="text-[11px] text-muted-foreground font-mono">
          {collapsed() ? 'Rail: 56px (collapsed)' : `Panel: ${Math.round(pixelSize())}px`}
        </span>
      </div>

      <div class="border border-border/60 rounded-xl bg-card/30 h-64 w-full shadow-xs overflow-hidden">
        <Resizable>
          <Resizable.Panel
            min="20%"
            max="40%"
            collapsible
            collapsibleMin={56}
            onCollapse={(px) => {
              setCollapsed(true)
              setPixelSize(px)
            }}
            onExpand={(px) => {
              setCollapsed(false)
              setPixelSize(px)
            }}
            class="bg-muted/25 flex flex-col transition-colors justify-between"
          >
            <div class="p-2 space-y-1">
              <For each={NAV_ITEMS}>
                {(item) => (
                  <div
                    class={`text-xs px-2.5 py-1.5 rounded-lg flex gap-2.5 cursor-pointer transition-colors items-center ${
                      item.label === 'Dashboard'
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <Icon name={item.icon} class="shrink-0 size-4" />
                    <span class="flex-1 truncate">{item.label}</span>
                    <Show when={item.badge}>
                      <span class="text-[10px] text-muted-foreground font-mono px-1 rounded bg-muted">
                        {item.badge}
                      </span>
                    </Show>
                  </div>
                )}
              </For>
            </div>

            <div class="p-2.5 border-t border-border/40 flex gap-2 items-center">
              <div class="text-[10px] text-primary font-semibold rounded-full bg-primary/20 flex size-6 items-center justify-center">
                MO
              </div>
              <div class="text-[11px] text-muted-foreground truncate">moraine-app</div>
            </div>
          </Resizable.Panel>

          <Resizable.Handle action="collapse">
            {(state) => (
              <Icon
                name={state.collapsed ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
                class="text-muted-foreground/80 size-3"
              />
            )}
          </Resizable.Handle>

          <Resizable.Panel class="p-4 bg-background/50 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="pb-2 border-b border-border/40 flex items-center justify-between">
                <span class="text-xs text-foreground font-semibold">Project Overview</span>
                <span class="text-[10px] text-muted-foreground">Updated 2m ago</span>
              </div>
              <div class="text-xs gap-2 grid grid-cols-2">
                <div class="p-3 border border-border/50 rounded-lg bg-muted/15 space-y-1">
                  <div class="text-[11px] text-muted-foreground">Build Status</div>
                  <div class="text-emerald-600 font-medium flex gap-1.5 items-center dark:text-emerald-400">
                    <span class="rounded-full bg-emerald-500 size-1.5 animate-pulse" />
                    Operational
                  </div>
                </div>
                <div class="p-3 border border-border/50 rounded-lg bg-muted/15 space-y-1">
                  <div class="text-[11px] text-muted-foreground">Hydration Score</div>
                  <div class="text-foreground font-medium">99.8%</div>
                </div>
              </div>
            </div>

            <p class="text-[11px] text-muted-foreground">
              When collapsed, the panel retains an accessible 56px icon rail without unmounting
              state.
            </p>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}
