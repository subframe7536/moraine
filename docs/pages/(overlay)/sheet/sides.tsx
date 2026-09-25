import { Button, Sheet } from '@src'

export function Sides() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet>
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:panel-left">
          Left (Navigation)
        </Sheet.Trigger>
        <Sheet.Content
          side="left"
          title="Application Navigation"
          description="Jump to any workspace section."
        >
          <Sheet.Body>
            {
              <div class="py-2 space-y-2">
                <Button
                  variant="ghost"
                  class="w-full justify-start"
                  leading="i-lucide:layout-dashboard"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  class="w-full justify-start"
                  leading="i-lucide:git-pull-request"
                >
                  Pull Requests
                </Button>
                <Button variant="ghost" class="w-full justify-start" leading="i-lucide:server">
                  Deployments
                </Button>
                <Button variant="ghost" class="w-full justify-start" leading="i-lucide:settings">
                  Settings
                </Button>
              </div>
            }
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet>
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:shopping-cart">
          Right (Cart Drawer)
        </Sheet.Trigger>
        <Sheet.Content
          side="right"
          title="Shopping Cart (2 items)"
          description="Review your selected items before checkout."
        >
          <Sheet.Body>
            {
              <div class="py-2 space-y-3 text-xs">
                <div class="p-2 bg-muted/40 flex items-center justify-between rounded-lg">
                  <div>
                    <p class="font-medium">Moraine UI Team License</p>
                    <p class="text-muted-foreground">Qty: 1</p>
                  </div>
                  <span class="font-mono font-semibold">$199.00</span>
                </div>
                <div class="p-2 bg-muted/40 flex items-center justify-between rounded-lg">
                  <div>
                    <p class="font-medium">Priority SLA Support</p>
                    <p class="text-muted-foreground">Qty: 1</p>
                  </div>
                  <span class="font-mono font-semibold">$49.00</span>
                </div>
              </div>
            }
          </Sheet.Body>
          <Sheet.Footer>
            {
              <Button class="w-full" variant="default">
                Proceed to Checkout ($248.00)
              </Button>
            }
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>

      <Sheet>
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:share-2">
          Bottom (Share)
        </Sheet.Trigger>
        <Sheet.Content
          side="bottom"
          title="Share Resource"
          description="Share this repository or report with teammates."
        >
          <Sheet.Body>
            {
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
            }
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
