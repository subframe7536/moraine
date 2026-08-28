import { Button, Textarea } from '@src'

export function Composition() {
  return (
    <div class="max-w-md w-full">
      <Textarea
        placeholder="Write a comment..."
        autoResize
        rows={2}
        maxRows={6}
        footer={
          <div class="flex w-full items-center justify-between">
            <span class="text-xs text-muted-foreground">Markdown supported</span>
            <Button size="xs">Comment</Button>
          </div>
        }
      />
    </div>
  )
}
