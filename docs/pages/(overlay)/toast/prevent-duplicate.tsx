import { Button, Icon } from '@src'
import { BaseToaster, toast } from 'solid-toaster'

export function SetupUsage() {
  return (
    <div class="space-y-4">
      <BaseToaster
        position="bottom-right"
        preventDuplicate
        id="pd"
        icons={{
          success: <Icon name="icon-success" />,
          error: <Icon name="icon-error" />,
          warning: <Icon name="icon-warning" />,
          info: <Icon name="icon-info" />,
          loading: <Icon name="icon-loading" class="animate-spin" />,
          close: <Icon name="icon-close" />,
        }}
      />
      <Button onClick={() => toast.success('Changes saved!', { toasterId: 'pd' })}>
        Trigger Success Toast
      </Button>
    </div>
  )
}
