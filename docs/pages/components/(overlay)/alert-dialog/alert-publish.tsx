import { AlertDialog, Button } from '@src'
import { createSignal } from 'solid-js'

export function AlertPublish() {
  const [attempt, setAttempt] = createSignal(0)
  const [status, setStatus] = createSignal('Not published')

  const publish = () => {
    void AlertDialog.confirm({
      title: 'Publish release?',
      content: 'The first attempt fails. Choose Publish again from the dialog.',
      okText: 'Publish',
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            const next = attempt() + 1
            setAttempt(next)
            if (next === 1) {
              setStatus('Publish failed. The dialog stays open.')
              reject(new Error('publish failed'))
              return
            }
            setStatus('Release published.')
            resolve()
          }, 700)
        }),
    })
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button onClick={publish}>Publish release</Button>
      <p class="text-sm text-muted-foreground">{status()}</p>
    </div>
  )
}
