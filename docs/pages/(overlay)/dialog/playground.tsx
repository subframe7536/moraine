import { Button, Dialog } from '@src'

export interface DialogPlaygroundProps {
  title?: string
  fullscreen?: boolean
  overlay?: boolean
}

export function DialogPlayground(props: DialogPlaygroundProps) {
  return (
    <Dialog
      title={props.title ?? 'Delete project'}
      description="This action cannot be undone."
      body={<p class="text-sm text-foreground">The project and its records will be removed.</p>}
      fullscreen={props.fullscreen ?? false}
      overlay={props.overlay ?? true}
    >
      {(triggerProps) => <Button {...triggerProps}>Open dialog</Button>}
    </Dialog>
  )
}
