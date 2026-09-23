import { Button, Icon } from '@src'
import { BaseToaster, toast } from 'solid-toaster'

export function PrevientDuplicate() {
  const ICONS = {
    success: <Icon name="icon-success" />,
    error: <Icon name="icon-error" />,
    warning: <Icon name="icon-warning" />,
    info: <Icon name="icon-info" />,
    loading: <Icon name="icon-loading" class="animate-spin" />,
    close: <Icon name="icon-close" />,
  }

  const TOASTER_STYLE = {
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  }

  return (
    <div class="space-y-4">
      <BaseToaster
        position="top-right"
        preventDuplicate
        id="pd"
        icons={ICONS}
        style={TOASTER_STYLE}
      />
      <Button onClick={() => toast.success('Changes saved!', { toasterId: 'pd' })}>
        Trigger Success Toast
      </Button>
    </div>
  )
}
