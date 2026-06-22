import { Button, Icon, SidebarFrame } from '@src'
import { For } from 'solid-js'

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
        renderSidebarHeader={() => <div class="text-sm font-semibold p-4">Documentation</div>}
        renderSidebarBody={() => (
          <div class="p-2 h-full overflow-y-auto">
            <div class="flex flex-col gap-1">
              <For each={PAGES}>
                {(item) => (
                  <button
                    type="button"
                    class="text-sm px-2.5 py-1.5 text-left rounded-md hover:bg-accent"
                  >
                    {item}
                  </button>
                )}
              </For>
            </div>
          </div>
        )}
        renderMain={(ctx) => (
          <>
            <div class="flex flex-row items-center">
              <Button variant="ghost" classes={{ root: 'm-2' }} onClick={() => ctx.toggle()}>
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
