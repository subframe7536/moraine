import { Skeleton } from '@src'

export function SkeletonAvatar() {
  return (
    <div class="flex gap-4 w-fit items-center">
      <Skeleton class="rounded-full shrink-0 size-10" />
      <div class="gap-2 grid">
        <Skeleton class="h-4 w-[150px]" />
        <Skeleton class="h-4 w-[100px]" />
      </div>
    </div>
  )
}
