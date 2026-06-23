import { Button, Popup } from '@src'

export function DefaultContainer() {
  return (
    <Popup
      content={
        <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
          <h3 class="text-sm font-semibold">Popup content</h3>
          <p class="text-sm text-muted-foreground mt-1">
            This content controls its own spacing and visuals.
          </p>
        </div>
      }
    >
      <Button>Open popup</Button>
    </Popup>
  )
}
