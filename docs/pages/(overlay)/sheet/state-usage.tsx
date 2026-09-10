import { Button, Sheet } from '@src'
import { createSignal } from 'solid-js'

export function StateUsage() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Managed Sheet</Button>
      <Sheet open={open()} onOpenChange={setOpen}>
        <Sheet.Content
          title="Controlled Sheet"
          description="Controlled open state enables external workflow triggers."
          body={
            <p class="text-xs text-muted-foreground py-2">
              Reactive state is managed by parent container.
            </p>
          }
          footer={
            <div class="flex w-full justify-end">
              <Button size="xs" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          }
        />
      </Sheet>
    </div>
  )
}
