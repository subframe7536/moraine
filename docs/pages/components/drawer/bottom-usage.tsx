import { Button, Drawer } from '@src'

export function BottomUsage() {
  return (
    <Drawer>
      <Drawer.Trigger as={Button}>Open Bottom Drawer</Drawer.Trigger>
      <Drawer.Content title="Share" description="Swipe down or pick an action to dismiss.">
        <Drawer.Body>
          <div class="py-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leading="i-lucide:copy">
              Copy Link
            </Button>
            <Button variant="outline" size="sm" leading="i-lucide:mail">
              Email Team
            </Button>
            <Button variant="outline" size="sm" leading="i-lucide:qr-code">
              Show QR
            </Button>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
