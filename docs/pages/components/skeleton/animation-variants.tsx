import { Skeleton } from '@src'

export function AnimationVariants() {
  return (
    <div class="flex gap-3 max-w-sm w-full items-center">
      <Skeleton variant="shimmer" class="rounded-full shrink-0 size-10" />
      <div class="flex-1 space-y-2">
        <Skeleton variant="shimmer" class="h-4 w-2/3" />
        <Skeleton variant="shimmer" class="h-3 w-full" />
      </div>
    </div>
  )
}
