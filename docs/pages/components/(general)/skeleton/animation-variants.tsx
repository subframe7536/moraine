import { Skeleton } from '@src'

export function AnimationVariants() {
  return (
    <div class="gap-6 grid max-w-sm w-full">
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Pulse</p>
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
      </div>
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Shimmer</p>
        <Skeleton variant="shimmer" class="h-4 w-full" />
        <Skeleton variant="shimmer" class="h-4 w-3/4" />
      </div>
    </div>
  )
}
