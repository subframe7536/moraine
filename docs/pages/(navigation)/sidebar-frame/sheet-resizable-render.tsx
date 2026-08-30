import { Badge, Button, Icon, SidebarFrame, SidebarFrameSheetResizableRender } from '@src'
import { For, createSignal } from 'solid-js'

const NAV_ITEMS = [
  { label: 'Overview', icon: 'i-lucide:layout-dashboard', active: true },
  { label: 'Members', icon: 'i-lucide:users' },
  { label: 'Billing', icon: 'i-lucide:credit-card' },
  { label: 'Security', icon: 'i-lucide:shield-check' },
  { label: 'Audit Log', icon: 'i-lucide:file-text' },
  { label: 'API Keys', icon: 'i-lucide:key' },
]

export function SheetResizableRender() {
  const [collapsed, setCollapsed] = createSignal(false)

  return (
    <div class="border border-border/70 rounded-xl bg-background h-72 w-full overflow-hidden">
      <SidebarFrame
        isMobile={false}
        frameRender={(ctx) => (
          <SidebarFrameSheetResizableRender
            {...ctx}
            resizablePanelOptions={{
              defaultSize: '30%',
              min: 160,
              max: 300,
              collapsible: collapsed(),
              collapsibleMin: 52,
            }}
            resizableOptions={{
              handleAction: 'collapse',
              classes: {
                divider:
                  'after:(transition duration-200 ease-out z-resize) hover:after:(bg-primary/20 w-1.5)',
              },
            }}
          />
        )}
        sidebarHeaderRender={() => (
          <div class="p-2.5 border-b border-border/60 flex items-center justify-between overflow-hidden">
            <div class="flex gap-2 min-w-0 items-center">
              <div class="text-primary rounded-md bg-primary/10 flex shrink-0 size-6 items-center justify-center">
                <Icon name="i-lucide:boxes" class="size-3.5" />
              </div>
              <span class="text-xs text-foreground font-semibold truncate">Acme Studio</span>
            </div>
            <Badge variant="outline" size="sm" class="rounded-md shrink-0">
              Pro
            </Badge>
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="p-1.5 h-full overflow-y-auto">
            <div class="flex flex-col gap-0.5">
              <For each={NAV_ITEMS}>
                {(item) => (
                  <button
                    type="button"
                    class={`text-xs px-2.5 py-1.5 rounded-md flex gap-2.5 w-full transition-colors items-center ${
                      item.active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Icon name={item.icon} class="shrink-0 size-3.5" />
                    <span class="truncate">{item.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 flex flex-col gap-3 h-full overflow-y-auto">
            <div class="pb-2.5 border-b border-border/50 flex items-center justify-between">
              <div class="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  class="text-xs px-2 rounded-md h-7"
                  onClick={() => setCollapsed((prev) => !prev)}
                >
                  <Icon
                    name={collapsed() ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left-close'}
                    class="mr-1 size-3.5"
                  />
                  <span>{collapsed() ? 'Expand' : 'Collapse'}</span>
                </Button>
                <span class="text-xs text-muted-foreground">/</span>
                <span class="text-xs text-foreground font-medium">Workspace Settings</span>
              </div>
              <span class="text-[0.7rem] text-muted-foreground font-mono">min: 52px</span>
            </div>

            <div class="space-y-1">
              <h4 class="text-sm text-foreground font-semibold">Draggable Resizable Frame</h4>
              <p class="text-xs text-muted-foreground leading-relaxed">
                Drag the divider line between panels to freely adjust the sidebar width, or toggle
                the button to collapse into an icon mini-rail.
              </p>
            </div>

            <div class="mt-auto p-3 border border-border/60 rounded-lg bg-card/40 flex items-center justify-between">
              <div class="space-y-0.5">
                <p class="text-xs text-foreground font-medium">Team Quota</p>
                <p class="text-[0.7rem] text-muted-foreground">8 of 10 seats allocated</p>
              </div>
              <Button size="sm" variant="outline" class="text-xs rounded-md h-7">
                Upgrade
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
