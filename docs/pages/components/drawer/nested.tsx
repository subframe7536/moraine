import { Button, Drawer } from '@src'

export function Nested() {
  return (
    <Drawer>
      <Drawer.Trigger as={Button}>Open Parent Drawer</Drawer.Trigger>
      <Drawer.Content
        class="h-[60dvh]"
        title="Parent drawer"
        description="The child drawer opens above this one."
      >
        <Drawer.Body>
          <div class="text-xs text-muted-foreground py-2 space-y-3">
            <p>Swipe, Escape, or the back gesture dismisses only the topmost drawer.</p>
            <Drawer>
              <Drawer.Trigger as={Button} variant="outline" size="sm">
                Open Child Drawer
              </Drawer.Trigger>
              <Drawer.Content title="Child drawer" description="A short nested surface.">
                <Drawer.Body>
                  <div class="text-xs text-muted-foreground py-2">
                    Confirm the action or go back to the parent drawer.
                  </div>
                </Drawer.Body>
                <Drawer.Footer>
                  <div class="flex gap-2 w-full justify-end">
                    <Drawer.Close as={Button} variant="ghost" size="sm">
                      Cancel
                    </Drawer.Close>
                    <Drawer.Close as={Button} size="sm">
                      Confirm
                    </Drawer.Close>
                  </div>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
