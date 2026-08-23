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
          onChange={setLocked}
          checkedIcon="i-lucide-lock"
          uncheckedIcon="i-lucide-lock-open"
        />
      </div>

      <Collapsible
        open={open()}
        disabled={locked()}
        onOpenChange={setOpen}
        class="b-(1 border) rounded-lg w-full"
      >
        <Collapsible.Trigger class="group text-sm font-medium px-4 py-3 text-left flex w-full items-center justify-between data-disabled:opacity-60">
          <span>June invoice #INV-2048</span>
          <Icon
            name="i-lucide-chevron-down"
            aria-hidden="true"
            class="group-data-expanded:rotate-180 text-muted-foreground transition-transform"
          />
        </Collapsible.Trigger>
        <Collapsible.Content class="text-sm text-foreground px-4 pb-4">
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
              <Icon name="i-lucide-info" />
              <span>Locked invoices cannot be expanded from the row trigger.</span>
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
