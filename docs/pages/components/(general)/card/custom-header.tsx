import { Card } from '@src'

export function CustomHeader() {
  return (
    <Card class="max-w-sm">
      <Card.Header class="flex items-center justify-between">
        <div>
          <p class="text-muted-foreground text-xs">Storage</p>
          <p class="font-semibold text-2xl">72%</p>
        </div>
        <span class="text-success font-medium text-xs">12 GB free</span>
      </Card.Header>
      <Card.Body>
        <p class="text-muted-foreground text-sm">Archive old uploads to reclaim more space.</p>
      </Card.Body>
    </Card>
  )
}
