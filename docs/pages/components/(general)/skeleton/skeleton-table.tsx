import { Skeleton } from '@src'
import { For } from 'solid-js'

export function SkeletonTable() {
  return (
    <div class="flex flex-col gap-2 max-w-sm w-full">
      <For each={Array.from({ length: 5 })}>
        {() => (
          <div class="flex gap-4">
            <Skeleton class="flex-1 h-4" />
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-20" />
          </div>
        )}
      </For>
    </div>
  )
}
