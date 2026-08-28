import { Button, Sheet } from '@src'

export function DrawerUsage() {
  return (
    <Sheet
      title="Edit Configuration"
      description="Update workspace variables and environment keys."
      body={
        <div class="text-xs text-muted-foreground py-4">
          Changes take effect immediately on next deployment cycle.
        </div>
      }
      footer={
        <div class="flex gap-2 w-full justify-end">
          <Button variant="ghost">Cancel</Button>
          <Button>Save Settings</Button>
        </div>
      }
    >
      {(props) => <Button {...props}>Open Settings Drawer</Button>}
    </Sheet>
  )
}
