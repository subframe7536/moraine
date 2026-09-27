import { Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

export function InfiniteScroll() {
  function makeOptions(count: number, offset = 0): SelectT.Item[] {
    return Array.from({ length: count }, (_, i) => ({
      label: `Option ${offset + i + 1}`,
      value: `opt-${offset + i + 1}`,
    }))
  }

  const [infiniteOptions, setInfiniteOptions] = createSignal<SelectT.Item[]>(makeOptions(20))

  const [loadingMore, setLoadingMore] = createSignal(false)

  return (
    <div class="w-80 space-y-2">
      <Select
        items={infiniteOptions()}
        classes={{
          listbox: 'max-h-100',
        }}
        onScrollBottom={() => {
          if (loadingMore()) {
            return
          }
          setLoadingMore(true)
          setTimeout(() => {
            const next = infiniteOptions().length
            setInfiniteOptions((prev) => [...prev, ...makeOptions(10, next)])
            setLoadingMore(false)
          }, 1000)
        }}
        scrollBottomThreshold={30}
        loading={loadingMore()}
        placeholder="Scroll to load more..."
      />
      <p class="text-muted-foreground text-xs">Total items: {infiniteOptions().length}</p>
    </div>
  )
}
