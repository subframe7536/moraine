import { Button, Collapsible, Icon } from '@src'

export function Stateful() {
  return (
    <div class="max-w-xl w-full">
      <Collapsible defaultOpen class="b-(1 border) rounded-lg w-full">
        <div class="px-3 py-2 flex gap-3 items-center justify-between">
          <div>
            <div class="flex gap-2 items-center">
              <Icon name="i-lucide-rocket" class="text-muted-foreground shrink-0" />
              <span class="font-medium truncate">Production deploy #4812</span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5">Completed 6 minutes ago</p>
          </div>
          <Collapsible.Trigger
            as={Button}
            aria-label="Toggle deploy details"
            size="icon-sm"
            variant="secondary"
            class="group"
          >
            <Icon
              name="i-lucide-chevron-down"
              class="group-data-expanded:rotate-180 transition-transform"
            />
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content class="text-sm text-foreground px-3 pb-3">
          <div class="space-y-1.5">
            <p>Commit b8a29c7 promoted the billing workspace and search index workers.</p>
            <p class="text-muted-foreground">Runtime: 2m 14s. Region: iad1. Rollback available.</p>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
