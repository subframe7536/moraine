import { Button, Drawer } from '@src'
import { createSignal } from 'solid-js'

export function NonModal() {
  const [count, setCount] = createSignal(0)

  return (
    <div class="max-w-sm w-full space-y-3">
      <div class="text-xs text-muted-foreground leading-relaxed">
        The panel floats without an overlay or focus trap — the page button below stays live while
        it is open. Count: {count()}
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setCount((value) => value + 1)}>
          Page action
        </Button>
        <Drawer modal={false} overlay={false} preventScroll={false}>
          <Drawer.Trigger as={Button} size="sm">
            Open Panel
          </Drawer.Trigger>
          <Drawer.Content
            title="Quick actions"
            description="Escape or a downward swipe still dismisses."
          >
            <Drawer.Body>
              <div class="py-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCount((value) => value + 1)}>
                  Increment
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCount(0)}>
                  Reset
                </Button>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
    </div>
  )
}
