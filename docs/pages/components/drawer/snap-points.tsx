import { Button, Drawer } from '@src'
import type { DrawerT } from '@src'
import { createSignal } from 'solid-js'

export function SnapPoints() {
  const [snapPoint, setSnapPoint] = createSignal<DrawerT.SnapPoint | null>('200px')

  return (
    <Drawer snapPoints={['200px', 1]} snapPoint={snapPoint()} onSnapPointChange={setSnapPoint}>
      <Drawer.Trigger as={Button}>Open Snap Drawer</Drawer.Trigger>
      <Drawer.Content
        class="h-[calc(100dvh-4rem)]"
        title="Snap points"
        description="Drag to rest at 200px or full height."
      >
        <Drawer.Body>
          <div class="text-xs text-muted-foreground py-4 space-y-3">
            <p>
              The drawer rests at a 200px peek or expands to the full surface. Drag the handle or
              the panel to move between them, or swipe down from the lowest point to close.
            </p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSnapPoint('200px')}>
                Peek
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSnapPoint(1)}>
                Expand
              </Button>
            </div>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
