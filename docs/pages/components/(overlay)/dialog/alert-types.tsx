import { Button } from '@src'
import { useAlertDialog } from '@src/utils'

export function AlertTypes() {
  const [alert, Holder] = useAlertDialog()

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        onClick={() =>
          void alert.info({
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
          void alert.warning({
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
          void alert.error({
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
          void alert.success({
            title: 'Deploy finished',
            content: 'The release is live.',
          })
        }
      >
        Success
      </Button>
      <Holder />
    </div>
  )
}
