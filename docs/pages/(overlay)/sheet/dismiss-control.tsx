import { Button, Sheet } from '@src'
import { createSignal } from 'solid-js'

export function DismissControl() {
  const [open, setOpen] = createSignal(false)
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet
        open={open()}
        onOpenChange={setOpen}
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
      >
        <Sheet.Trigger as={Button} variant="outline">
          Open persistent sheet
        </Sheet.Trigger>
        <Sheet.Content
          title="Persistent sheet"
          description="Outside click and Escape key dismissal are blocked."
          body={
            <div class="py-2 space-y-3">
              <p class="text-sm text-muted-foreground">
                This sheet cannot be dismissed by clicking the overlay or pressing Escape.
              </p>
              <p class="text-sm text-foreground">
                Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
              </p>
            </div>
          }
          footer={
            <div class="flex w-full justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>
                Close sheet
              </Button>
            </div>
          }
        />
      </Sheet>
    </div>
  )
}
