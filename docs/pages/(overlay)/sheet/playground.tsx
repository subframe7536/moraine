import { Button, Input, Sheet } from '@src'

export interface SheetPlaygroundProps {
  side?: 'top' | 'right' | 'bottom' | 'left'
  dismissible?: boolean
  overlay?: boolean
}

export function SheetPlayground(props: SheetPlaygroundProps) {
  return (
    <Sheet
      side={props.side ?? 'right'}
      title="Edit User Profile"
      description="Make changes to your account profile here."
      dismissible={props.dismissible ?? true}
      overlay={props.overlay ?? true}
      body={
        <div class="py-3 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground font-medium">Display name</label>
            <Input defaultValue="Sarah Connor" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground font-medium">Username</label>
            <Input defaultValue="@sconnor" />
          </div>
        </div>
      }
      footer={
        <div class="flex gap-2 w-full justify-end">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save changes</Button>
        </div>
      }
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline">
          Open Sheet
        </Button>
      )}
    </Sheet>
  )
}
