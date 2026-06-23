import { SidebarFrame } from '@src'
import { For } from 'solid-js'

export function Variants() {
  return (
    <div class="flex flex-col gap-3 w-full">
      <For each={['default', 'floating', 'inset'] as const}>
        {(variant) => (
          <div class="b-1 b-border rounded-xl h-72 w-full overflow-hidden">
            <SidebarFrame
              isMobile={false}
              variant={variant}
              renderSidebarHeader={() => <div class="text-xs p-3">{variant}</div>}
              renderSidebarBody={() => (
                <div class="text-sm text-muted-foreground p-2">Sidebar content</div>
              )}
              renderMain={() => (
                <div class="p-4 h-full">
                  <div class="text-sm text-foreground p-4 b-1 b-border rounded-lg b-dashed bg-muted/20 h-full">
                    Main content area
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </For>
    </div>
  )
}
