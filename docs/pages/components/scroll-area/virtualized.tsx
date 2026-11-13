import { ScrollArea } from '@src'
import { createListVirtualizer } from '@src/virtualizer'

const LOG_LINES = Array.from({ length: 10_000 }, (_, index) => `Request ${index + 1} completed`)

export function Virtualized() {
  const virtualizer = createListVirtualizer<string>({ estimateSize: () => 32, overscan: 8 })

  return (
    <ScrollArea
      shadow
      items={LOG_LINES}
      virtualizer={virtualizer}
      itemRender={(props) => (
        <div {...props.props} class="text-sm px-3 py-1.5 flex gap-3 tabular-nums">
          <span class="text-muted-foreground w-12">{props.index + 1}</span>
          <span>{props.item}</span>
        </div>
      )}
      class="border border-border rounded-md h-80 max-w-md w-full"
      role="region"
      aria-label="Request log"
    />
  )
}
