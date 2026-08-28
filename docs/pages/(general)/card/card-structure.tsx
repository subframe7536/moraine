import { Button, Card } from '@src'

export function CardStructure() {
  return (
    <div class="max-w-sm w-full">
      <Card
        title="Project Deployment"
        description="Configure automated build triggers."
        footer={
          <div class="flex gap-2 w-full justify-end">
            <Button variant="ghost" size="xs">
              Cancel
            </Button>
            <Button size="xs">Deploy</Button>
          </div>
        }
      >
        <p class="text-sm text-muted-foreground">
          Deployments are pushed directly to the globally distributed edge CDN network.
        </p>
      </Card>
    </div>
  )
}
