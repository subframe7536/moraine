import { Button, Collapsible, Icon, IconButton } from '@src'

export function Stateful() {
  return (
    <div class="max-w-xl space-y-2">
      <Collapsible
        defaultOpen
        classes={{
          root: 'rounded-lg b-(1 border)',
          trigger: 'w-xl px-3 py-2 text-left text-sm flex items-center justify-between',
          content: 'px-3 pb-3 text-sm text-foreground',
        }}
        renderTrigger={(context) => (
          <>
            <div class="min-w-0">
              <div class="flex gap-2 items-center">
                <Icon name="i-lucide-rocket" class="text-muted-foreground shrink-0 size-4" />
                <span class="font-medium truncate">Production deploy #4812</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Completed 6 minutes ago</p>
            </div>
            <Button
              {...context.triggerProps}
              aria-label="Toggle deploy details"
              size="sm"
              variant="secondary"
              classes={{
                label: `transition-transform ${context.isOpen ? 'rotate-180' : ''}`,
              }}
            >
              <Icon name="i-lucide-chevron-down" />
            </Button>
          </>
        )}
      >
        <div class="space-y-1.5">
          <p>Commit b8a29c7 promoted the billing workspace and search index workers.</p>
          <p class="text-muted-foreground">Runtime: 2m 14s. Region: iad1. Rollback available.</p>
        </div>
      </Collapsible>
    </div>
  )
}
