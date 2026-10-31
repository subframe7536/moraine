import { Button, Card, Collapsible } from '@src'

export function Composable() {
  return (
    <div class="max-w-md w-full">
      <Card>
        <Card.Body>
          <Collapsible transition>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">@solidjs starred 3 repositories</span>
              <Collapsible.Trigger
                as={Button}
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle repositories"
                leading="i-lucide:chevrons-up-down"
              />
            </div>

            <div class="text-sm font-mono mt-2 px-4 py-2 border border-border rounded-md">
              @solidjs/router
            </div>

            <Collapsible.Content>
              <div class="pt-2 space-y-2">
                <div class="text-sm font-mono px-4 py-2 border border-border rounded-md">
                  @solidjs/testing-library
                </div>
                <div class="text-sm font-mono px-4 py-2 border border-border rounded-md">
                  subframe7536/moraine
                </div>
              </div>
            </Collapsible.Content>
          </Collapsible>
        </Card.Body>
      </Card>
    </div>
  )
}
