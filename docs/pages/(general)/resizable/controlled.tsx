import { Resizable } from '@src'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'

export function ControlledSizes() {
  const [sizes, setSizes] = createStore([360, 640])
  const label = createMemo(() => sizes.map((size) => `${Math.round(size)}px`).join(' / '))

  return (
    <div class="space-y-3">
      <div class="b-1 b-border border-border rounded-xl h-48 overflow-hidden">
        <Resizable
          onResize={(nextSizes) => nextSizes.forEach((size, index) => setSizes(index, size))}
        >
          <Resizable.Panel size={sizes[0]} min="20%" class="p-4 bg-muted">
            Logs
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel size={sizes[1]} min="25%" class="p-4 bg-background">
            Preview
          </Resizable.Panel>
        </Resizable>
      </div>
      <p class="text-xs text-muted-foreground">Current sizes: {label()}</p>
    </div>
  )
}
