import { Card, Skeleton } from '@src'

export function SkeletonCard() {
  return (
    <Card class="max-w-xs w-full">
      <Card.Header>
        <div class="flex flex-col gap-2">
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </Card.Header>
      <Card.Body>
        <Skeleton class="w-full aspect-video" />
      </Card.Body>
    </Card>
  )
}
