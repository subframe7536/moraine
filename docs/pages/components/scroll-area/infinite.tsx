import { ScrollArea } from '@src'
import { For, Show, createSignal } from 'solid-js'

const PAGE_SIZE = 15
const TOTAL = 75

export function Infinite() {
  const [count, setCount] = createSignal(PAGE_SIZE)
  const [loading, setLoading] = createSignal(false)

  function loadMore(): void {
    if (loading() || count() >= TOTAL) {
      return
    }
    setLoading(true)
    setTimeout(() => {
      setCount((current) => Math.min(current + PAGE_SIZE, TOTAL))
      setLoading(false)
    }, 600)
  }

  return (
    <ScrollArea
      edgeThreshold={48}
      onReachEnd={(axis) => axis === 'y' && loadMore()}
      class="h-64 max-w-sm w-full"
      classes={{ content: 'pe-3' }}
      role="region"
      aria-label="Order history"
    >
      <For each={Array.from({ length: count() }, (_, index) => index + 1)}>
        {(order) => (
          <div class="text-sm py-2 border-b border-border flex justify-between">
            <span>Order #{1000 + order}</span>
            <span class="text-muted-foreground">${(order * 17) % 300}.00</span>
          </div>
        )}
      </For>
      <p class="text-xs text-muted-foreground py-3 text-center" aria-live="polite">
        <Show when={count() < TOTAL} fallback="All orders loaded">
          {loading() ? 'Loading more orders…' : 'Scroll for more'}
        </Show>
      </p>
    </ScrollArea>
  )
}
