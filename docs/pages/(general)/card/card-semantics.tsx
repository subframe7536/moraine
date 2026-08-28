import { Badge, Card } from '@src'

export function CardSemantics() {
  return (
    <div class="max-w-sm w-full">
      <Card
        as="article"
        title="Release v2.4.0 Available"
        description="Published 2 hours ago by @release-bot"
        action={<Badge>New</Badge>}
      >
        <p class="text-sm text-muted-foreground">
          Includes performance optimizations, smaller bundle sizes, and refreshed component styles.
        </p>
      </Card>
    </div>
  )
}
