import { Button, Collapsible, Input } from '@src'

export function ContentLifetime() {
  return (
    <div class="max-w-md w-full">
      <Collapsible unmountOnHide={false} defaultOpen>
        <Collapsible.Trigger as={Button} size="xs" variant="outline">
          Persistent filter fields
        </Collapsible.Trigger>
        <Collapsible.Content class="mt-2 p-3 b-(1 border) rounded-lg space-y-2">
          <p class="text-xs text-muted-foreground">
            Input state persists while closed when unmountOnHide is false.
          </p>
          <Input defaultValue="tag:moraine" placeholder="Search filter" />
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
