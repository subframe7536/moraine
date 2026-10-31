import { Button, Sheet } from '@src'

export function Sides() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet side="left">
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:panel-left">
          Left (navigation)
        </Sheet.Trigger>
        <Sheet.Content title="Application navigation" description="Jump to any workspace section.">
          <Sheet.Body>
            <div class="py-2 flex flex-col gap-1 items-stretch">
              <Button variant="ghost" leading="i-lucide:layout-dashboard">
                Dashboard
              </Button>
              <Button variant="ghost" leading="i-lucide:git-pull-request">
                Pull requests
              </Button>
              <Button variant="ghost" leading="i-lucide:server">
                Deployments
              </Button>
              <Button variant="ghost" leading="i-lucide:settings">
                Settings
              </Button>
            </div>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet side="right">
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:shopping-cart">
          Right (cart drawer)
        </Sheet.Trigger>
        <Sheet.Content
          title="Shopping cart (2 items)"
          description="Review your selected items before checkout."
        >
          <Sheet.Body>
            <div class="text-sm py-2 space-y-3">
              <div class="p-3 rounded-lg bg-muted flex items-center justify-between">
                <div>
                  <p class="font-medium">Canvas backpack</p>
                  <p class="text-xs text-muted-foreground">Qty: 1</p>
                </div>
                <span class="font-mono font-semibold">$199.00</span>
              </div>
              <div class="p-3 rounded-lg bg-muted flex items-center justify-between">
                <div>
                  <p class="font-medium">Travel organizer</p>
                  <p class="text-xs text-muted-foreground">Qty: 1</p>
                </div>
                <span class="font-mono font-semibold">$49.00</span>
              </div>
            </div>
          </Sheet.Body>
          <Sheet.Footer>
            <Button>Proceed to checkout ($248.00)</Button>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>

      <Sheet side="bottom">
        <Sheet.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:share-2">
          Bottom (share)
        </Sheet.Trigger>
        <Sheet.Content
          title="Share resource"
          description="Share this repository or report with teammates."
        >
          <Sheet.Body>
            <div class="py-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" leading="i-lucide:copy">
                Copy link
              </Button>
              <Button variant="outline" size="sm" leading="i-lucide:mail">
                Email team
              </Button>
              <Button variant="outline" size="sm" leading="i-lucide:qr-code">
                Show QR
              </Button>
            </div>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
