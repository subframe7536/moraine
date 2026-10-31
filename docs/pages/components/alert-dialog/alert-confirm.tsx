import { AlertDialog, Badge, Button } from '@src'
import { createSignal, Show } from 'solid-js'

export function AlertConfirm() {
  const [revoked, setRevoked] = createSignal(false)

  const confirmRevoke = async () => {
    const result = await AlertDialog.confirm({
      title: 'Revoke secret API key?',
      description:
        'Active background workers and webhook integrations using "Production Sync Key" will immediately lose API access.',
      danger: true,
      action: {
        label: 'Revoke key',
        onClick: async () => {
          await new Promise((resolve) => setTimeout(resolve, 600))
        },
      },
      cancel: { label: 'Keep key' },
    }).result()
    if (result === 'action') {
      setRevoked(true)
    }
  }

  return (
    <div class="p-4 b-1 b-border rounded-xl bg-card/50 flex flex-col gap-3 max-w-md w-full">
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="text-sm font-medium">Production Sync Key</span>
          <Show when={!revoked()} fallback={<Badge variant="outline">Revoked</Badge>}>
            <Badge variant="soft" tone="success">
              Active
            </Badge>
          </Show>
        </div>
        <span class="text-xs text-muted-foreground font-mono">sk_live_•••94f2</span>
      </div>
      <p class="text-xs text-muted-foreground">
        Created on Oct 12, 2026. Last used 2 minutes ago by ingest worker.
      </p>
      <div class="pt-2 b-border b-t-1 flex items-center justify-between">
        <span class="text-xs text-muted-foreground">
          {revoked() ? 'Key access has been revoked.' : 'Full access to sync endpoints.'}
        </span>
        <Show
          when={!revoked()}
          fallback={
            <Button size="sm" variant="ghost" onClick={() => setRevoked(false)}>
              Restore key
            </Button>
          }
        >
          <Button size="sm" variant="outline" tone="danger" onClick={() => void confirmRevoke()}>
            Revoke key
          </Button>
        </Show>
      </div>
    </div>
  )
}
