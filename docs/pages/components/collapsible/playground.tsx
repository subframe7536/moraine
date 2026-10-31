import { Button, Card, Collapsible, Icon } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function CollapsiblePlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'transition', label: 'Transition', defaultValue: true },
      ]}
    >
      {(props) => (
        <div class="max-w-md min-h-64 w-full">
          <Card class="border-border/60 rounded-xl bg-card/50">
            <Card.Body class="p-4">
              <Collapsible transition={props.transition} disabled={props.disabled}>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-foreground font-medium">
                    @solidjs starred 3 repositories
                  </span>
                  <Collapsible.Trigger
                    as={Button}
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Toggle repositories"
                    disabled={props.disabled}
                  >
                    <Icon name="i-lucide:chevrons-up-down" class="size-4" />
                  </Collapsible.Trigger>
                </div>
                <div class="text-xs font-mono mt-2 px-3 py-2 border border-border/50 rounded-lg bg-background/50">
                  @solidjs/router
                </div>
                <Collapsible.Content class="pt-2 space-y-2">
                  <div class="text-xs font-mono px-3 py-2 border border-border/50 rounded-lg bg-background/50">
                    @solidjs/testing-library
                  </div>
                  <div class="text-xs font-mono px-3 py-2 border border-border/50 rounded-lg bg-background/50">
                    subframe7536/moraine
                  </div>
                </Collapsible.Content>
              </Collapsible>
            </Card.Body>
          </Card>
        </div>
      )}
    </DocsPlayground>
  )
}
