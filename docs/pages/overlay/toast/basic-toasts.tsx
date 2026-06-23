import 'solid-toaster/style.css'

import { Button } from '@src'
import { toast } from 'solid-toaster'

export function BasicToasts() {
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  const runLoadingToast = async () => {
    const id = toast.loading('Uploading files...')
    await wait(1200)
    toast.success('Upload complete', { id })
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button onClick={() => toast('Default message', { onAutoClose: console.log })}>
        Default
      </Button>
      <Button variant="secondary" onClick={() => toast.success('Saved successfully')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Careful with this action')}>
        Warning
      </Button>
      <Button variant="destructive" onClick={() => toast.error('Something went wrong')}>
        Error
      </Button>
      <Button variant="ghost" onClick={runLoadingToast}>
        Loading -&gt; Success
      </Button>
    </div>
  )
}
