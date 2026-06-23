import { Pagination } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="space-y-4">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground font-mono">{size}</p>
            <Pagination
              size={size}
              total={120}
              itemsPerPage={10}
              siblingCount={1}
              prevText="Prev"
              nextText="Next"
            />
          </div>
        )}
      </For>
    </div>
  )
}
