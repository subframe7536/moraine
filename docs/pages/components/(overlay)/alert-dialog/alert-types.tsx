import { AlertDialog, Button } from '@src'

export function AlertTypes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        onClick={() =>
          void AlertDialog.info({
            title: 'Sync scheduled',
            content: 'The workspace will refresh in the background.',
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
            content: 'Free space before the next backup.',
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
            content: 'The last deploy did not finish.',
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
            content: 'The release is live.',
          })
        }
      >
        Success
      </Button>
    </div>
  )
}
