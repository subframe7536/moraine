import { Button, Toast } from '@src'

export function BasicToasts() {
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  const runLoadingToast = async () => {
    const id = Toast.loading('Uploading files...')
    await wait(1200)
    Toast.success('Upload complete', { id })
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button onClick={() => Toast.show('Default message')}>Default</Button>
      <Button variant="secondary" onClick={() => Toast.success('Saved successfully')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => Toast.warning('Careful with this action')}>
        Warning
      </Button>
      <Button variant="destructive" onClick={() => Toast.error('Something went wrong')}>
        Error
      </Button>
      <Button variant="ghost" onClick={runLoadingToast}>
        Loading -&gt; Success
      </Button>
    </div>
  )
}
