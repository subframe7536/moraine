import { Skeleton } from '@src'

export function SkeletonForm() {
  return (
    <div class="flex flex-col gap-7 max-w-xs w-full">
      <div class="flex flex-col gap-3">
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-8 w-full" />
      </div>
      <div class="flex flex-col gap-3">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-8 w-full" />
      </div>
      <Skeleton class="h-8 w-24" />
    </div>
  )
}
