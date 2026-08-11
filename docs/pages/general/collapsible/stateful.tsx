import { Button, Collapsible, Icon } from '@src'

export function Stateful() {
  return (
    <div class="max-w-xl w-full">
      <Collapsible
        defaultOpen
        classes={{
          root: 'w-full rounded-lg b-(1 border)',
          content: 'px-3 pb-3 text-sm text-foreground',
        }}
        triggerRender={(context) => (
          <div class="px-3 py-2 flex gap-3 items-center justify-between">
            <div class="">
              <div class="flex gap-2 items-center">
                <Icon name="i-lucide-rocket" class="text-muted-foreground shrink-0 size-4" />
                <span class="font-medium truncate">Production deploy #4812</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Completed 6 minutes ago</p>
            </div>
            <Button
              {...context.triggerProps}
              aria-label="Toggle deploy details"
              size="icon-sm"
              variant="secondary"
              // class="shrink-0"
              leading="i-lucide-chevron-down"
              classes={{
                leading: `transition-transform ${context.isOpen ? 'rotate-180' : ''}`,
              }}
            />
          </div>
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
