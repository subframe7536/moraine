import { Button, Toast } from '@src'

export function StatusOutcomes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        leading="i-lucide:check"
        onClick={() =>
          Toast.success({
            title: 'Preferences saved',
            description: 'Your account preferences have been updated.',
          })
        }
      >
        Save preferences
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:alert-triangle"
        onClick={() =>
          Toast.warning({
            title: 'Storage warning',
            description: 'Workspace is using 92% of available disk space.',
          })
        }
      >
        Check disk usage
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:refresh-cw"
        onClick={() =>
          Toast.error({
            title: 'Sync failed',
            description: 'Could not connect to the remote repository.',
          })
        }
      >
        Sync repository
      </Button>
    </div>
  )
}
