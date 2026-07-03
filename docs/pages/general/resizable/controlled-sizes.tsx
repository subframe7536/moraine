import { Resizable } from '@src'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'

export function ControlledSizes() {
  function formatPixelSizes(sizes: number[]): string {
    return sizes.map((size) => `${Math.round(size)}px`).join(' / ')
  }

  const [controlledPanels, setControlledPanels] = createStore([
    {
      size: 360,
      min: '20%' as const,
      content: createPanel(
        'Logs',
        'Drag or use arrow keys to rebalance with px callbacks.',
        'bg-muted',
      ),
    },
    {
      size: 640,
      min: '25%' as const,
      content: createPanel(
        'Preview',
        'The external store writes callback px values back into panel.size.',
        'bg-background',
      ),
    },
  ])

  const controlledSizes = createMemo(() =>
    controlledPanels.map((panel) => (typeof panel.size === 'number' ? panel.size : 0)),
  )

  function handleControlledResize(nextSizes: number[]): void {
    nextSizes.forEach((nextSize, index) => {
      if (Number.isFinite(nextSize)) {
        setControlledPanels(index, 'size', nextSize)
      }
    })
  }

  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  return (
    <div class="space-y-3">
      <div class="b-1 b-border border-border rounded-xl h-48 overflow-hidden">
        <Resizable renderHandle onResize={handleControlledResize} panels={controlledPanels} />
      </div>
      <p class="text-xs text-muted-foreground">
        Current sizes: {formatPixelSizes(controlledSizes())}
      </p>
    </div>
  )
}
