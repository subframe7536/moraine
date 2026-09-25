import { Card } from '@src'

export function CustomHeader() {
  return (
    <Card class="max-w-sm">
      <Card.Header class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted-foreground">Storage</p>
          <p class="text-2xl font-semibold">72%</p>
        </div>
        <span class="text-success text-xs font-medium">12 GB free</span>
      </Card.Header>
      <Card.Body>
        <p class="text-sm text-muted-foreground">Archive old uploads to reclaim more space.</p>
      </Card.Body>
    </Card>
  )
}
