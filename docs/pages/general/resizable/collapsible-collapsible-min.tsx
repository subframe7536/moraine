import { Icon, Resizable } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function CollapsibleCollapsibleMin() {
  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  const [externalSizes, setExternalSizes] = createSignal<[number, number]>([320, 680])

  const externalPixelSizes = createMemo(() => formatPixelSizes(externalSizes()))

  function handleExternalResize(nextSizes: number[]): void {
    const sidebarSize = nextSizes[0]!
    const contentSize = nextSizes[1]!
    if (!Number.isFinite(sidebarSize) || !Number.isFinite(contentSize)) {
      return
    }

    setExternalSizes([sidebarSize, contentSize])
  }

  function formatPixelSizes(sizes: number[]): string {
    return sizes.map((size) => `${Math.round(size)}px`).join(' / ')
  }

  return (
    <div class="space-y-4">
      <div class="b-1 b-border border-border rounded-xl h-56 overflow-hidden">
        <Resizable
          handleAction="collapse"
          renderHandle={(state) => (
            <Icon name={state.collapsed ? 'i-lucide:align-justify' : 'i-lucide:align-left'} />
          )}
          onResize={handleExternalResize}
          classes={{
            divider:
              'w-[6px] rounded-full bg-accent/45 transition-colors duration-200 hover:bg-accent/45 data-dragging:bg-primary/70',
          }}
          panels={[
            {
              size: externalSizes()[0],
              min: '16%',
              collapsible: true,
              collapsibleMin: '10%',
              content: createPanel(
                'Sidebar',
                'Click the handle to collapse/expand. Drag the divider to resize.',
                'bg-muted',
              ),
            },
            {
              size: externalSizes()[1],
              min: '24%',
              content: createPanel(
                'Editor',
                'Dragging still works and keeps controlled px sizes in sync.',
                'bg-background',
              ),
            },
          ]}
        />
      </div>

      <p class="text-xs text-muted-foreground">
        Try: click handle to toggle, drag divider to resize.
      </p>
      <p class="text-xs text-muted-foreground">Current sizes: {externalPixelSizes()}</p>
    </div>
  )
}
