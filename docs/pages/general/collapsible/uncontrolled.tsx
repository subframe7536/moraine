import { Card, Collapsible, Icon, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Uncontrolled() {
  const [transition, setTransition] = createSignal(true)

  return (
    <div class="max-w-xs w-full space-y-3">
      <Switch label="Transition" checked={transition()} onChange={setTransition} />

      <div class="h-40">
        <Card
          classes={{
            root: 'py-3 rounded-lg',
            body: 'px-3 mb-0',
          }}
        >
          <Collapsible transition={transition()}>
            <Collapsible.Trigger class="group flex w-full items-center justify-between">
              <span>How do I reset my password?</span>
              <Icon
                name="i-lucide-chevron-down"
                aria-hidden="true"
                class="group-data-expanded:rotate-180 transition-transform"
              />
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div class="text-sm text-muted-foreground pt-3">
                You can reset your password from Account settings. We send a verification link to
                the primary email on the workspace.
              </div>
            </Collapsible.Content>
          </Collapsible>
        </Card>
      </div>
    </div>
  )
}
