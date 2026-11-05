import { Button, Sheet } from '@src'

export function SettingsUsage() {
  return (
    <Sheet>
      <Sheet.Trigger as={Button}>Open Settings</Sheet.Trigger>
      <Sheet.Content title="Settings" description="Fields in the body, actions in the footer.">
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
