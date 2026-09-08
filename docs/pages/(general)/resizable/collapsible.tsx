import { Icon, Resizable } from '@src'
import { createSignal } from 'solid-js'

export function CollapsibleCollapsibleMin() {
  const [sizes, setSizes] = createSignal([320, 680])

  return (
    <div class="space-y-4">
      <div class="b-1 b-border border-border rounded-xl h-56 overflow-hidden">
        <Resizable onResize={setSizes}>
          <Resizable.Panel
            size={sizes()[0]}
            min="16%"
            collapsible
            collapsibleMin="10%"
            class="p-4 bg-muted"
          >
            Sidebar
          </Resizable.Panel>
          <Resizable.Handle action="collapse">
            {(state) => (
              <Icon name={state.collapsed ? 'i-lucide:align-justify' : 'i-lucide:align-left'} />
            )}
          </Resizable.Handle>
          <Resizable.Panel size={sizes()[1]} min="24%" class="p-4 bg-background">
            Editor
          </Resizable.Panel>
        </Resizable>
      </div>
      <p class="text-xs text-muted-foreground">Click the grip to collapse, or drag to resize.</p>
    </div>
  )
}
