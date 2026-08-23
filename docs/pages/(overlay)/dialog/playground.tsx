import { Button, Dialog } from '@src'

export interface DialogPlaygroundProps {
  title?: string
  fullscreen?: boolean
  overlay?: boolean
}

export function DialogPlayground(props: DialogPlaygroundProps) {
  return (
    <Dialog
      title={props.title ?? 'Delete deployment'}
      description="This action is permanent and will stop all running containers."
      body={
        <p class="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete <code class="docs-inline-code">prod-cluster-east</code>?
          All active traffic will immediately failover to standby.
        </p>
      }
      footer={
        <div class="flex gap-2 w-full justify-end">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="destructive" size="sm">
            Delete permanently
          </Button>
        </div>
      }
      fullscreen={props.fullscreen ?? false}
      overlay={props.overlay ?? true}
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline">
          Open Dialog
        </Button>
      )}
    </Dialog>
  )
}
