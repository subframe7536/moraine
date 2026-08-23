import { Button, Card, Collapsible, Icon } from '@src'

export interface CollapsiblePlaygroundProps {
  disabled?: boolean
  transition?: boolean
}

export function CollapsiblePlayground(props: CollapsiblePlaygroundProps) {
  return (
    <div class="max-w-md w-full">
      <Card classes={{ root: 'p-4 rounded-xl border border-border/60 bg-card/50' }}>
        <Collapsible transition={props.transition ?? true} disabled={props.disabled ?? false}>
          <div class="flex items-center justify-between">
            <span class="text-xs text-foreground font-medium">@solidjs starred 3 repositories</span>
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
      </Card>
    </div>
  )
}
