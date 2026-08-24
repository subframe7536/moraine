import { Badge, Button, Card } from '@src'

export function Sizes() {
  return (
    <div class="gap-4 grid max-w-2xl sm:grid-cols-2">
      <Card
        compact
        title="Edge Cluster #04"
        description="US East (N. Virginia)"
        footer={
          <div class="flex w-full items-center justify-between">
            <span class="text-xs text-muted-foreground font-mono">4 Nodes Online</span>
            <Button size="xs" variant="outline">
              Restart
            </Button>
          </div>
        }
        class="h-fit"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">99.98% Uptime</span>
          <Badge variant="solid" size="sm">
            Healthy
          </Badge>
        </div>
      </Card>

      <Card
        title="Storage & Bandwidth"
        description="Current billing cycle usage"
        footer={
          <div class="flex w-full items-center justify-between">
            <span class="text-xs text-muted-foreground">Renews Nov 1</span>
            <Button size="sm" variant="default">
              Upgrade Plan
            </Button>
          </div>
        }
        class="h-fit"
      >
        <p class="text-sm text-foreground">
          You have used <span class="text-primary font-mono font-semibold">74.2 GB</span> of your
          100 GB monthly quota.
        </p>
      </Card>
    </div>
  )
}
