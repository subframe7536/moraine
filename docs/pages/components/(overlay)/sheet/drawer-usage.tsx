import { Button, Sheet } from '@src'

export function DrawerUsage() {
  return (
    <Sheet>
      <Sheet.Trigger as={Button}>Open Settings Drawer</Sheet.Trigger>
      <Sheet.Content title="Settings drawer" description="A drawer with body and footer regions.">
        <Sheet.Body>
          <div class="text-xs text-muted-foreground py-4">
            Place settings fields in this region and actions in the footer.
          </div>
        </Sheet.Body>
        <Sheet.Footer>
          <div class="flex gap-2 w-full justify-end">
            <Sheet.Close as={Button} variant="ghost">
              Cancel
            </Sheet.Close>
            <Sheet.Close as={Button}>Done</Sheet.Close>
          </div>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  )
}
