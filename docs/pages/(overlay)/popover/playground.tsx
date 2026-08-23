import { Button, Input, Popover } from '@src'

export interface PopoverPlaygroundProps {
  placement?: 'top' | 'right' | 'bottom' | 'left'
  disabled?: boolean
  dismissible?: boolean
}

export function PopoverPlayground(props: PopoverPlaygroundProps) {
  return (
    <Popover
      placement={props.placement ?? 'bottom'}
      disabled={props.disabled ?? false}
      dismissible={props.dismissible ?? true}
      body={
        <div class="p-4 w-72 space-y-3">
          <h4 class="text-xs text-foreground font-semibold">Dimensions & Scale</h4>
          <div class="space-y-2">
            <div class="flex gap-2 items-center justify-between">
              <span class="text-xs text-muted-foreground">Width</span>
              <Input size="sm" defaultValue="100%" class="w-28" />
            </div>
            <div class="flex gap-2 items-center justify-between">
              <span class="text-xs text-muted-foreground">Max height</span>
              <Input size="sm" defaultValue="300px" class="w-28" />
            </div>
          </div>
        </div>
      }
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline" size="sm">
          Adjust dimensions
        </Button>
      )}
    </Popover>
  )
}
