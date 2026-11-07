import { Button, Drawer } from '@src'

export function Sides() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Drawer side="bottom">
        <Drawer.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:chevron-down">
          Bottom
        </Drawer.Trigger>
        <Drawer.Content title="Bottom drawer" description="Swipe down to dismiss.">
          <Drawer.Body>
            <div class="text-xs text-muted-foreground py-2">
              Bottom drawers show the handle first and follow a downward drag.
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      <Drawer side="top">
        <Drawer.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:chevron-up">
          Top
        </Drawer.Trigger>
        <Drawer.Content title="Top drawer" description="Swipe up to dismiss.">
          <Drawer.Body>
            <div class="text-xs text-muted-foreground py-2">
              Top drawers pin to the top edge and move the handle to the end.
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      <Drawer side="left">
        <Drawer.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:panel-left">
          Left
        </Drawer.Trigger>
        <Drawer.Content title="Left drawer" description="Swipe left to dismiss.">
          <Drawer.Body>
            <div class="text-xs text-muted-foreground py-2">
              Side drawers skip the handle and snap points.
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      <Drawer side="right">
        <Drawer.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:panel-right">
          Right
        </Drawer.Trigger>
        <Drawer.Content title="Right drawer" description="Swipe right to dismiss.">
          <Drawer.Body>
            <div class="text-xs text-muted-foreground py-2">
              Right drawers track a horizontal drag toward the edge.
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}
