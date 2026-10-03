import { Skeleton } from '@src'

export function SkeletonDemo() {
  return (
    <div class="flex gap-4 max-w-sm w-full items-center">
      <Skeleton class="rounded-full shrink-0 size-12" />
      <div class="flex-1 min-w-0 space-y-2">
        <Skeleton class="h-4 max-w-[250px] w-full" />
        <Skeleton class="h-4 max-w-[200px] w-full" />
      </div>
    </div>
  )
}
