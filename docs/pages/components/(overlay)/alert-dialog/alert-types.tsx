import { AlertDialog, Button } from '@src'

export function AlertTypes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        onClick={() =>
          void AlertDialog.info({
            title: 'Sync scheduled',
            description: 'The workspace will refresh in the background.',
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          void AlertDialog.warning({
            title: 'Storage is almost full',
            description: 'Free space before the next backup.',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          void AlertDialog.error({
            title: 'Deploy failed',
            description: 'The last deploy did not finish.',
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          void AlertDialog.success({
            title: 'Deploy finished',
            description: 'The release is live.',
          })
        }
      >
        Success
      </Button>
    </div>
  )
}
