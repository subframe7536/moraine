import { Button, Card, Collapsible, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Uncontrolled() {
  const [transition, setTransition] = createSignal(true)

  return (
    <div class="max-w-xs w-full space-y-3">
      <Switch label="Transition" checked={transition()} onCheckedChange={setTransition} />

      <div class="min-h-40">
        <Card>
          <Card.Body>
            <Collapsible transition={transition()}>
              <div class="flex gap-2 items-center justify-between">
                <span class="text-sm font-medium">How do I reset my password?</span>
                <Collapsible.Trigger
                  as={Button}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle answer"
                  leading="i-lucide:chevron-down"
                />
              </div>
              <Collapsible.Content>
                <p class="text-sm text-muted-foreground pt-3">
                  You can reset your password from Account settings. We send a verification link to
                  the primary email on the workspace.
                </p>
              </Collapsible.Content>
            </Collapsible>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}
