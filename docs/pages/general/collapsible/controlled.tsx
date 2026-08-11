import { Button, cn, Collapsible, Icon, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [open, setOpen] = createSignal(true)
  const [locked, setLocked] = createSignal(false)

  return (
    <div class="w-full max-w-md space-y-3">
      <div class="flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={() => !locked() && setOpen((value) => !value)}>
          {open() ? 'Hide invoice details' : 'Show invoice details'}
        </Button>
        <Switch
          label="Lock edits"
          checked={locked()}
          onChange={setLocked}
          checkedIcon="i-lucide-lock"
          uncheckedIcon="i-lucide-lock-open"
        />
      </div>

      <Collapsible
        open={open()}
        disabled={locked()}
        onOpenChange={setOpen}
        classes={{
          root: 'w-full rounded-lg b-(1 border)',
          trigger:
            'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between data-disabled:opacity-60',
          content: 'px-4 pb-4 text-sm text-foreground',
        }}
        triggerRender={(context) => (
          <button {...context.triggerProps}>
            <span>June invoice #INV-2048</span>
            <Icon
              name="i-lucide-chevron-down"
              aria-hidden="true"
              class={cn(
                'text-muted-foreground transition-transform',
                context.isOpen ? 'rotate-180' : '',
              )}
            />
          </button>
        )}
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Plan</span>
            <span>Team Pro</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Seats</span>
            <span>18 active</span>
          </div>
          <div class="text-muted-foreground flex gap-2 items-center">
            <Icon name="i-lucide-info" class="size-4" />
            <span>Locked invoices cannot be expanded from the row trigger.</span>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
