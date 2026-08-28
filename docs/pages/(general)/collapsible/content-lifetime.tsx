import { Collapsible, Input } from '@src'

export function ContentLifetime() {
  return (
    <div class="max-w-md w-full">
      <Collapsible label="Persistent filter fields" keepMounted defaultOpen>
        <div class="mt-2 p-3 b-(1 border) rounded-lg space-y-2">
          <p class="text-xs text-muted-foreground">
            Input state persists while closed when keepMounted is set.
          </p>
          <Input defaultValue="tag:moraine" placeholder="Search filter" />
        </div>
      </Collapsible>
    </div>
  )
}
