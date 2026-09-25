import { Button, Card } from '@src'

export function CardStructure() {
  return (
    <Card class="max-w-sm w-full">
      <Card.Header>
        <Card.Title as="h3">Project Deployment</Card.Title>
        <Card.Description>Configure automated build triggers.</Card.Description>
      </Card.Header>
      <Card.Body>
        <p class="text-sm text-muted-foreground">
          Deployments are pushed directly to the globally distributed edge CDN network.
        </p>
      </Card.Body>
      <Card.Footer class="gap-2 justify-end">
        <Button variant="ghost" size="xs">
          Cancel
        </Button>
        <Button size="xs">Deploy</Button>
      </Card.Footer>
    </Card>
  )
}
