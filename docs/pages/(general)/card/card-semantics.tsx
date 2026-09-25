import { Badge, Card } from '@src'

export function CardSemantics() {
  return (
    <Card as="article" class="max-w-sm w-full">
      <Card.Header>
        <Card.Title as="h3">Release v2.4.0 Available</Card.Title>
        <Card.Description>Published 2 hours ago by @release-bot</Card.Description>
        <Card.Action>
          <Badge>New</Badge>
        </Card.Action>
      </Card.Header>
      <Card.Body>
        <p class="text-sm text-muted-foreground">
          Includes performance optimizations, smaller bundle sizes, and refreshed component styles.
        </p>
      </Card.Body>
    </Card>
  )
}
