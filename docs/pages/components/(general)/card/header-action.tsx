import { Button, Card } from '@src'

export function HeaderAction() {
  return (
    <Card class="w-lg">
      <Card.Header>
        <Card.Title as="h3">Meeting Notes</Card.Title>
        <Card.Description>Transcript summary from the latest client sync.</Card.Description>
        <Card.Action>
          <Button size="sm" variant="secondary">
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
      <Card.Footer class="justify-end">
        <Button size="sm" variant="outline">
          Dismiss
        </Button>
        <Button size="sm">Save</Button>
      </Card.Footer>
    </Card>
  )
}
