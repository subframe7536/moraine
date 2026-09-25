import { Button, Collapsible, Input } from '@src'

export function ContentLifetime() {
  return (
    <div class="max-w-md w-full">
      <Collapsible unmountOnHide={false} defaultOpen>
        <Collapsible.Trigger as={Button} size="xs" variant="outline">
          Persistent filter fields
        </Collapsible.Trigger>
        <Collapsible.Content class="mt-2 p-3 b-(1 border) space-y-2 rounded-lg">
          <p class="text-muted-foreground text-xs">
            Input state persists while closed when unmountOnHide is false.
          </p>
          <Input defaultValue="tag:moraine" placeholder="Search filter" />
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
