import { Button, Tooltip } from '@src'

export function HintsUsage() {
  return (
    <div class="flex gap-4 items-center">
      <Tooltip text="View project deployment history and logs">
        {(props) => (
          <Button {...props} variant="outline">
            Deploy History
          </Button>
        )}
      </Tooltip>
    </div>
  )
}
