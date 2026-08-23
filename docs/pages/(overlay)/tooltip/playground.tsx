import { Button, Tooltip } from '@src'

export interface TooltipPlaygroundProps {
  placement?: 'top' | 'right' | 'bottom' | 'left'
  text?: string
  disabled?: boolean
  invert?: boolean
}

export function TooltipPlayground(props: TooltipPlaygroundProps) {
  return (
    <div class="p-6 flex items-center justify-center">
      <Tooltip
        text={props.text ?? 'Create new document'}
        kbds={['⌘', 'N']}
        placement={props.placement ?? 'top'}
        disabled={props.disabled ?? false}
        invert={props.invert ?? false}
      >
        {(triggerProps) => (
          <Button {...triggerProps} variant="outline" leading="i-lucide:file-plus">
            Hover me
          </Button>
        )}
      </Tooltip>
    </div>
  )
}
