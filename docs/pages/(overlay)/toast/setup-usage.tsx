import { Button, Icon } from '@src'
import { BaseToaster, toast } from 'solid-toaster'

export function SetupUsage() {
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
    <>
      <BaseToaster style={TOASTER_STYLE} visibleToasts={4} icons={ICONS} />
      <BaseToaster id="custom" position="bottom-left" style={TOASTER_STYLE} icons={ICONS} />
      <Button onClick={() => toast.success('Changes saved!')}>Trigger Success Toast</Button>
    </>
  )
}
