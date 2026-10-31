import { AlertDialog, Badge, Button } from '@src'
import { createSignal, Show } from 'solid-js'

export function AlertCenter() {
  const [status, setStatus] = createSignal<'idle' | 'allowed' | 'blocked'>('idle')

  const connect = async () => {
    const result = await AlertDialog.confirm({
      title: 'Allow security key to connect?',
      description:
        'Hardware key "YubiKey 5C NFC" is requesting permission to authenticate and read security credentials.',
      icon: 'i-lucide:usb',
      center: true,
      subtle: true,
      width: 380,
      action: { label: 'Allow key' },
      cancel: { label: "Don't allow" },
    }).result()
    setStatus(result === 'action' ? 'allowed' : 'blocked')
  }

  return (
    <div class="p-4 b-1 b-border rounded-xl bg-card/50 flex flex-col gap-3 max-w-md w-full">
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="text-sm font-medium">YubiKey 5C NFC</span>
          <Show when={status() === 'idle'}>
            <Badge variant="outline">Not connected</Badge>
          </Show>
          <Show when={status() === 'allowed'}>
            <Badge variant="soft" tone="success">
              Connected
            </Badge>
          </Show>
          <Show when={status() === 'blocked'}>
            <Badge variant="soft" tone="danger">
              Blocked
            </Badge>
          </Show>
        </div>
        <span class="text-xs text-muted-foreground font-mono">USB-C / NFC</span>
      </div>
      <p class="text-xs text-muted-foreground">
        Hardware FIDO2 / WebAuthn token used for multi-factor authentication.
      </p>
      <div class="pt-2 b-border b-t-1 flex items-center justify-between">
        <span class="text-xs text-muted-foreground">
          {status() === 'idle' && 'Waiting for authorization...'}
          {status() === 'allowed' && 'Hardware credentials authorized.'}
          {status() === 'blocked' && 'Access request denied by user.'}
        </span>
        <Button size="sm" variant="outline" onClick={() => void connect()}>
          {status() === 'allowed' ? 'Reconnect' : 'Connect key'}
        </Button>
      </div>
    </div>
  )
}
