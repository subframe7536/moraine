import { Button, Toast } from '@src'

export function CustomPlacement() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toast id="bottom-dock" placement="bottom" align="start" />
      <Button
        variant="outline"
        leading="i-lucide:arrow-down-left"
        onClick={() =>
          Toast.info({
            title: 'Background task started',
            description: 'Analyzing code workspace...',
            host: 'bottom-dock',
          })
        }
      >
        Notify bottom-left
      </Button>
      <Button variant="ghost" leading="i-lucide:x" onClick={() => Toast.close()}>
        Dismiss all
      </Button>
    </div>
  )
}
