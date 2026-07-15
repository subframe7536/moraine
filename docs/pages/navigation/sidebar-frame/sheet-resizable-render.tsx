import { Button, ListBox, SidebarFrame, SidebarFrameSheetResizableRender } from '@src'
import { createSignal } from 'solid-js'

const ITEMS = ['Overview', 'Members', 'Billing', 'Security', 'Audit Log', 'API Keys']

export function SheetResizableRender() {
  const [collapsed, setCollapsed] = createSignal(false)

  return (
    <div class="b-1 b-border rounded-xl h-72 w-full overflow-hidden">
      <SidebarFrame
        isMobile={false}
        frameRender={(ctx) => (
          <SidebarFrameSheetResizableRender
            {...ctx}
            resizablePanelOptions={{
              defaultSize: '24%',
              min: 100,
              max: 200,
              collapsible: collapsed(),
              collapsibleMin: 56,
            }}
            resizableOptions={{
              handleAction: 'collapse',
              classes: {
                divider:
                  'after:(transition duration-200 ease-out z-20) hover:after:(bg-accent w-1.5)',
              },
            }}
          />
        )}
        sidebarHeaderRender={() => <div class="text-sm p-3">Workspace</div>}
        sidebarBodyRender={() => (
          <div class="p-2 h-full overflow-y-auto">
            <ListBox
              items={ITEMS.map((item) => ({ value: item, label: item }))}
              classes={{
                content: 'gap-1',
                item: 'text-sm px-2.5 py-1.5 min-h-0 rounded-md hover:bg-accent data-highlighted:bg-transparent',
              }}
            />
          </div>
        )}
        mainRender={() => (
          <div class="p-4 flex flex-col gap-3 h-full">
            <h3 class="text-base font-semibold">Resizable Desktop Frame</h3>
            <p class="text-sm text-muted-foreground">
              Drag divider to resize sidebar width. Click button to toggle collapse.
            </p>
            <p class="text-xs text-muted-foreground">collapsibleMin: 56px</p>
            <div>
              <Button
                size="sm"
                leading={collapsed() ? 'i-lucide:panel-left-open' : 'i-lucide:panel-left'}
                onClick={() => setCollapsed((prev) => !prev)}
              >
                {collapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'}
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
