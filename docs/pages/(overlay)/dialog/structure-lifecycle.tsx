import { Badge, Button, Dialog } from '@src'
import { createSignal } from 'solid-js'

export function StructureLifecycle() {
  const [exits, setExits] = createSignal(0)
  const [status, setStatus] = createSignal('Idle')

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Dialog
        onExitComplete={() => {
          setExits((c) => c + 1)
          setStatus('Exit animation completed')
        }}
      >
        <Dialog.Trigger as={Button}>Open Provisioning Dialog</Dialog.Trigger>
        <Dialog.Content
          title="Provision Production Database"
          description="Configure clustering, replication nodes, and automated backup schedules."
          body={
            <div class="text-xs text-muted-foreground leading-relaxed py-2 space-y-2">
              <p>
                Provisioning will allocate dedicated compute instances and initialize encryption
                keys.
              </p>
            </div>
          }
          footer={
            <div class="flex gap-2 w-full justify-end">
              <Button variant="outline">Cancel</Button>
              <Button>Provision Cluster</Button>
            </div>
          }
        />
      </Dialog>

      <div class="text-xs text-muted-foreground flex gap-2 items-center">
        <span>Lifecycle status:</span>
        <Badge variant="outline">{status()}</Badge>
        <span>(Completed exits: {exits()})</span>
      </div>
    </div>
  )
}
