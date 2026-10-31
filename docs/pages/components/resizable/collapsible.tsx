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
          <span class="text-muted-foreground">Click the handle grip or the button</span>
        </div>
        <span class="text-xs text-muted-foreground font-mono">
          {collapsed() ? 'Rail: 56px (collapsed)' : `Panel: ${Math.round(pixelSize())}px`}
        </span>
      </div>

      <div class="border border-border rounded-xl h-64 w-full overflow-hidden">
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
          >
            <div class="flex flex-col h-full justify-between">
              <div class="p-2 space-y-1">
                <For each={NAV_ITEMS}>
                  {(item) => (
                    <div
                      class={`text-xs px-2.5 py-1.5 rounded-lg flex gap-2.5 cursor-pointer items-center ${
                        item.label === 'Dashboard'
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon name={item.icon} />
                      <span class="flex-1 truncate">{item.label}</span>
                      <Show when={item.badge}>
                        <span class="text-xs text-muted-foreground font-mono px-1 rounded bg-muted">
                          {item.badge}
                        </span>
                      </Show>
                    </div>
                  )}
                </For>
              </div>

              <div class="p-2.5 border-t border-border flex gap-2 items-center">
                <div class="text-xs text-primary font-semibold rounded-full bg-primary/20 flex size-6 items-center justify-center">
                  MO
                </div>
                <div class="text-xs text-muted-foreground truncate">moraine-app</div>
              </div>
            </div>
          </Resizable.Panel>

          <Resizable.Handle action="collapse">
            {(state) => (
              <Icon
                name={state.collapsed ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
              />
            )}
          </Resizable.Handle>

          <Resizable.Panel>
            <div class="p-4 flex flex-col h-full justify-between">
              <div class="space-y-3">
                <div class="pb-2 border-b border-border flex items-center justify-between">
                  <span class="text-xs font-semibold">Project Overview</span>
                  <span class="text-xs text-muted-foreground">Updated 2m ago</span>
                </div>
                <div class="text-xs gap-2 grid grid-cols-2">
                  <div class="p-3 border border-border rounded-lg space-y-1">
                    <div class="text-muted-foreground">Build Status</div>
                    <div class="font-medium">Operational</div>
                  </div>
                  <div class="p-3 border border-border rounded-lg space-y-1">
                    <div class="text-muted-foreground">Hydration Score</div>
                    <div class="font-medium">99.8%</div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-muted-foreground">
                The collapsed panel keeps a 56px icon rail and does not unmount its state.
              </p>
            </div>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}
