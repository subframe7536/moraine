import { Button, Drawer } from '@src'

export function Nested() {
  return (
    <Drawer>
      <Drawer.Trigger as={Button} variant="outline">
        Nested drawers
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header class="text-center">
          <Drawer.Title>First step</Drawer.Title>
          <Drawer.Description>
            This is the first step. Tap the button below to continue to the next screen.
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Footer class="justify-center sm:justify-center">
          <Drawer.Close as={Button} variant="ghost">
            Cancel
          </Drawer.Close>
          <Drawer overlay={false}>
            <Drawer.Trigger as={Button} variant="outline">
              Continue
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header class="text-center">
                <Drawer.Title>Second step</Drawer.Title>
                <Drawer.Description>
                  You&apos;ve reached the second step. Tap the button below to continue to the next
                  screen.
                </Drawer.Description>
              </Drawer.Header>
              <Drawer.Body>
                <div class="flex justify-center">
                  <div class="border border-border rounded-xl bg-muted shrink-0 size-48" />
                </div>
              </Drawer.Body>
              <Drawer.Footer class="justify-center sm:justify-center">
                <Drawer.Close as={Button} variant="ghost">
                  Back
                </Drawer.Close>
                <Drawer overlay={false}>
                  <Drawer.Trigger as={Button} variant="outline">
                    Continue
                  </Drawer.Trigger>
                  <Drawer.Content>
                    <Drawer.Header class="text-center">
                      <Drawer.Title>Third step</Drawer.Title>
                      <Drawer.Description>
                        You&apos;ve reached the final step. You can close this drawer or go back.
                      </Drawer.Description>
                    </Drawer.Header>
                    <Drawer.Body>
                      <div class="flex justify-center">
                        <div class="border border-border rounded-full bg-muted shrink-0 size-32" />
                      </div>
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
