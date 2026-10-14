import { Button, Toast } from '@src'

export function PreventDuplicate() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        leading="i-lucide:copy"
        onClick={() =>
          Toast.info({
            title: 'Link copied',
            description: 'Invite URL copied to clipboard.',
            preventDuplicate: true,
          })
        }
      >
        Copy invite link
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:bell-ring"
        onClick={() =>
          Toast.show({
            title: 'Already up to date',
            description: 'Checked for updates just now.',
            preventDuplicate: true,
          })
        }
      >
        Check for updates
      </Button>
    </div>
  )
}
