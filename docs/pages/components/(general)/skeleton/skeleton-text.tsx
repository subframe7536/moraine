import { Skeleton } from '@src'

export function SkeletonText() {
  return (
    <div class="flex flex-col gap-2 max-w-xs w-full">
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-3/4" />
    </div>
  )
}
