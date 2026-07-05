import { Button, Card } from '@src'

export function HeaderAction() {
  return (
    <div class="w-lg">
      <Card
        title="Meeting Notes"
        description="Transcript summary from the latest client sync."
        action={
          <Button size="sm" variant="secondary">
            Transcribe
          </Button>
        }
        footer={
          <div class="flex gap-2 w-full justify-end">
            <Button size="sm" variant="outline">
              Dismiss
            </Button>
            <Button size="sm">Save</Button>
          </div>
        }
      >
        <ol class="text-sm pl-5 list-decimal opacity-85 flex flex-col gap-1.5">
          <li>Dashboard redesign should prioritize mobile layouts.</li>
          <li>Timeline target is six weeks with weekly milestones.</li>
          <li>Next review meeting is scheduled for Tuesday morning.</li>
        </ol>
      </Card>
    </div>
  )
}
