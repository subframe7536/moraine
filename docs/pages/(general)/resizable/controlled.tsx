import { Resizable } from '@src'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'

export function ControlledSizes() {
  const [sizes, setSizes] = createStore([360, 640])
  const label = createMemo(() => sizes.map((size) => `${Math.round(size)}px`).join(' / '))

  return (
    <div class="space-y-3">
      <div class="b-1 b-border border-border h-48 overflow-hidden rounded-xl">
        <Resizable
          value={sizes}
          onChange={(nextSizes) => nextSizes.forEach((size, index) => setSizes(index, size))}
        >
          <Resizable.Panel min="20%" class="p-4 bg-muted">
            Logs
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel min="25%" class="p-4 bg-background">
            Preview
          </Resizable.Panel>
        </Resizable>
      </div>
      <p class="text-muted-foreground text-xs">Current sizes: {label()}</p>
    </div>
  )
}
