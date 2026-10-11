import { AlertDialog, Button } from '@src'
import { createSignal } from 'solid-js'

export function AlertPublish() {
  const [status, setStatus] = createSignal('Checks running')

  const publish = () => {
    setStatus('Checks running')
    let settled = false
    const dialog = AlertDialog.confirm({
      title: 'Publish release 1.4.0?',
      content: 'The last check is still running.',
      okText: 'Publish anyway',
      cancelText: 'Wait',
      onOk: () => {
        setStatus('Release 1.4.0 published')
      },
    })
    void dialog.then(() => {
      settled = true
    })

    setTimeout(() => {
      if (settled) {
        return
      }
      dialog.update({
        title: 'Checks passed',
        content: 'Release 1.4.0 is ready. Members get it when you publish.',
        okText: 'Publish now',
      })
      setStatus('Checks passed')
    }, 800)
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <span class="text-sm">Release 1.4.0</span>
      <Button size="sm" onClick={publish}>
        Publish
      </Button>
      <span class="text-sm text-muted-foreground">{status()}</span>
    </div>
  )
}
