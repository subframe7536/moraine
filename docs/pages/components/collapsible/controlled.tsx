import { Button, Collapsible, Icon, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [open, setOpen] = createSignal(true)
  const [locked, setLocked] = createSignal(false)

  return (
    <div class="max-w-md w-full space-y-3">
      <div class="flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={() => !locked() && setOpen((value) => !value)}>
          {open() ? 'Hide invoice details' : 'Show invoice details'}
        </Button>
        <Switch
          label="Lock edits"
          checked={locked()}
          onCheckedChange={setLocked}
          checkedIcon="i-lucide-lock"
          uncheckedIcon="i-lucide-lock-open"
        />
      </div>

      <div class="border border-border rounded-lg">
        <Collapsible open={open()} disabled={locked()} onOpenChange={setOpen}>
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-sm font-medium">June invoice #INV-2048</span>
            <Collapsible.Trigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle invoice details"
              disabled={locked()}
            >
              <Icon name="i-lucide-chevron-down" aria-hidden="true" />
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content>
            <div class="text-sm px-4 pb-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Plan</span>
                <span>Team Pro</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Seats</span>
                <span>18 active</span>
              </div>
              <div class="text-muted-foreground flex gap-2 items-center">
                <Icon name="i-lucide-info" />
                <span>Locked invoices cannot be expanded from the row trigger.</span>
              </div>
            </div>
          </Collapsible.Content>
        </Collapsible>
      </div>
    </div>
  )
}
