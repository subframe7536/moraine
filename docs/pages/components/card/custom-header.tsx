import { Card } from '@src'

export function CustomHeader() {
  return (
    <div class="max-w-sm w-full">
      <Card>
        <Card.Header>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">Storage</p>
              <p class="text-2xl font-semibold">72%</p>
            </div>
            <span class="text-xs text-success font-medium">12 GB free</span>
          </div>
        </Card.Header>
        <Card.Body>
          <p class="text-sm text-muted-foreground">Archive old uploads to reclaim more space.</p>
        </Card.Body>
      </Card>
    </div>
  )
}
