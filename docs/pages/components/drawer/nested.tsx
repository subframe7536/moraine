import { Button, Drawer } from '@src'

export function Nested() {
  return (
    <Drawer>
      <Drawer.Trigger as={Button}>Open drawer stack</Drawer.Trigger>
      <Drawer.Content
        class="h-[60dvh]"
        title="Account"
        description="Nested drawers stack on top of each other. Only the frontmost one is interactive."
      >
        <Drawer.Body>
          <div class="text-xs text-muted-foreground py-2 space-y-3">
            <p>
              The drawer behind adjusts its height and slides up, so every level shares one real
              overlay.
            </p>
            <Drawer overlay={false}>
              <Drawer.Trigger as={Button} variant="outline" size="sm">
                Security settings
              </Drawer.Trigger>
              <Drawer.Content
                class="h-[60dvh]"
                title="Security"
                description="Review sign-in activity and security preferences."
              >
                <Drawer.Body>
                  <ul class="text-xs text-muted-foreground py-2 ps-5 list-disc space-y-1">
                    <li>Passkeys enabled</li>
                    <li>2FA via authenticator app</li>
                    <li>3 signed-in devices</li>
                  </ul>
                  <Drawer overlay={false}>
                    <Drawer.Trigger as={Button} variant="outline" size="sm">
                      Advanced options
                    </Drawer.Trigger>
                    <Drawer.Content
                      class="h-[60dvh]"
                      title="Advanced"
                      description="The third drawer stacks on top of the other two."
                    >
                      <Drawer.Body>
                        <div class="text-xs text-muted-foreground py-2">
                          Swipe, Escape, or the back gesture dismisses only the topmost drawer.
                        </div>
                      </Drawer.Body>
                      <Drawer.Footer>
                        <div class="flex gap-2 w-full justify-end">
                          <Drawer.Close as={Button} size="sm">
                            Done
                          </Drawer.Close>
                        </div>
                      </Drawer.Footer>
                    </Drawer.Content>
                  </Drawer>
                </Drawer.Body>
                <Drawer.Footer>
                  <div class="flex gap-2 w-full justify-end">
                    <Drawer.Close as={Button} variant="ghost" size="sm">
                      Cancel
                    </Drawer.Close>
                    <Drawer.Close as={Button} size="sm">
                      Save
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
