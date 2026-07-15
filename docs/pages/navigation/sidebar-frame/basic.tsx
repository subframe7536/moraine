import { Button, Icon, ListBox, SidebarFrame } from '@src'

const PAGES = [
  'Introduction',
  'Installation',
  'Theming',
  'Button',
  'Input',
  'Dialog',
  'Dropdown Menu',
  'Tabs',
  'Table',
  'Form',
]

export function Basic() {
  return (
    <div class="b-1 b-border rounded-xl h-72 w-full overflow-hidden">
      <SidebarFrame
        isMobile={false}
        sidebarHeaderRender={() => <div class="text-sm font-semibold p-4">Documentation</div>}
        sidebarBodyRender={() => (
          <div class="p-2 h-full overflow-y-auto">
            <ListBox
              items={PAGES.map((item) => ({ value: item, label: item }))}
              classes={{
                content: 'gap-1',
                item: 'text-sm px-2.5 py-1.5 min-h-0 rounded-md hover:bg-accent data-highlighted:bg-transparent',
              }}
            />
          </div>
        )}
        mainRender={(ctx) => (
          <>
            <div class="flex flex-row items-center">
              <Button variant="ghost" class="m-2" onClick={() => ctx.toggle()}>
                <Icon name="i-lucide-sidebar" />
              </Button>
              <h3 class="text-base font-semibold">Getting Started</h3>
            </div>
            <p class="text-muted-foreground px-4">
              Use <code class="docs-inline-code">SidebarFrame</code> component to compose sidebar
              and content in one place.
            </p>
          </>
        )}
      />
    </div>
  )
}
