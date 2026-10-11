import { AlertDialog, Button } from '@src'
import { createSignal } from 'solid-js'

export function AlertCenter() {
  const [status, setStatus] = createSignal('No accessory connected')

  const connect = async () => {
    const allowed = await AlertDialog.confirm({
      title: 'Allow accessory to connect?',
      description: 'Do you want to allow the USB accessory to connect to this device?',
      icon: 'i-lucide-bluetooth',
      center: true,
      subtle: true,
      okText: 'Allow',
      cancelText: "Don't allow",
      width: 360,
    })
    setStatus(allowed ? 'USB accessory connected' : 'Accessory blocked')
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button size="sm" onClick={() => void connect()}>
        Connect accessory
      </Button>
      <span class="text-sm text-muted-foreground">{status()}</span>
    </div>
  )
}
