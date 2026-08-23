import { Button, Card, Collapsible, Icon } from '@src'

export function Composable() {
  return (
    <div class="max-w-md w-full">
      <Card
        classes={{
          root: 'p-4 rounded-xl border border-border bg-card',
        }}
      >
        <Collapsible transition>
          <div class="flex items-center justify-between">
            <span class="text-sm text-foreground font-semibold">
              @solidjs starred 3 repositories
            </span>
            <Collapsible.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle repositories"
            >
              <Icon name="i-lucide-chevrons-up-down" class="size-4" />
            </Collapsible.Trigger>
          </div>

          <div class="text-sm font-mono mt-2 px-4 py-2 border border-border rounded-md">
            @solidjs/router
          </div>

          <Collapsible.Content class="pt-2 space-y-2">
            <div class="text-sm font-mono px-4 py-2 border border-border rounded-md">
              @solidjs/testing-library
            </div>
            <div class="text-sm font-mono px-4 py-2 border border-border rounded-md">
              subframe7536/moraine
            </div>
          </Collapsible.Content>
        </Collapsible>
      </Card>
    </div>
  )
}
