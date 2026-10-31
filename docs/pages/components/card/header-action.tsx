import { Button, Card } from '@src'

export function HeaderAction() {
  return (
    <div class="max-w-full w-lg">
      <Card>
        <Card.Header>
          <Card.Title as="h3">Meeting Notes</Card.Title>
          <Card.Description>Transcript summary from the latest client sync.</Card.Description>
          <Card.Action>
            <Button size="sm" variant="soft" tone="neutral">
              Transcribe
            </Button>
          </Card.Action>
        </Card.Header>
        <Card.Body>
          <ol class="text-sm pl-5 list-decimal opacity-85 flex flex-col gap-1.5">
            <li>Dashboard redesign should prioritize mobile layouts.</li>
            <li>Timeline target is six weeks with weekly milestones.</li>
            <li>Next review meeting is scheduled for Tuesday morning.</li>
          </ol>
        </Card.Body>
        <Card.Footer>
          <div class="flex gap-3 w-full justify-end">
            <Button size="sm" variant="outline">
              Dismiss
            </Button>
            <Button size="sm">Save</Button>
          </div>
        </Card.Footer>
      </Card>
    </div>
  )
}
