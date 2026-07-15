import { Button, SidebarFrame } from '@src'
import { For } from 'solid-js'

const TASKS = [
  'Release checklist',
  'Migrate docs examples',
  'Review API naming',
  'Polish accessibility labels',
  'Publish changelog',
  'Sync design tokens',
  'Audit keyboard behavior',
  'Update migration notes',
  'Confirm package exports',
  'Refresh visual snapshots',
  'Prepare release branch',
  'Verify mobile layout',
]

export function HeaderFooterSlots() {
  return (
    <div class="b-1 b-border rounded-xl h-72 w-full overflow-hidden">
      <SidebarFrame
        isMobile={false}
        sidebarHeaderRender={() => (
          <div class="p-3">
            <p class="text-sm font-medium">Project Tasks</p>
            <p class="text-xs text-muted-foreground mt-1">Header slot content</p>
          </div>
        )}
        sidebarBodyRender={() => (
          <div class="p-2">
            <div class="flex flex-col gap-1">
              <For each={TASKS}>
                {(task) => (
                  <button
                    type="button"
                    class="text-sm px-2.5 py-1.5 text-left rounded-md hover:bg-accent"
                  >
                    {task}
                  </button>
                )}
              </For>
            </div>
          </div>
        )}
        sidebarFooterRender={() => (
          <div class="p-2 b-t b-border bg-background/80 flex gap-2 items-center justify-between">
            <span class="text-xs text-muted-foreground">12 tasks</span>
            <Button size="sm" variant="ghost">
              Footer Action
            </Button>
          </div>
        )}
        mainRender={() => (
          <div class="p-4 h-full">
            <h3 class="text-base font-semibold">Main Content</h3>
            <p class="text-sm text-muted-foreground mt-2">
              Sidebar header and footer are rendered from dedicated slots.
            </p>
          </div>
        )}
      />
    </div>
  )
}
