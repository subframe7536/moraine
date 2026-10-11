import { Button, Toaster, toast } from '@src'
import { createSignal } from 'solid-js'

export function PromiseScopedInstances() {
  const [promiseRuns, setPromiseRuns] = createSignal(0)
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  const runPromiseToast = () => {
    const nextRun = promiseRuns() + 1
    setPromiseRuns(nextRun)
    const request = wait(1400).then(() => ({ run: nextRun }))

    toast.promise(request, {
      loading: `Sync #${nextRun} in progress...`,
      success: (result) => `Sync #${result.run} finished`,
      error: (error) => `Sync failed: ${String(error)}`,
    })
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toaster />
      <Toaster id="custom" placement="bottom" align="start" />
      <Button onClick={runPromiseToast}>Run promise toast ({promiseRuns()})</Button>
      <Button
        variant="outline"
        onClick={() => toast.info('To bottom-left custom', { toasterId: 'custom' })}
      >
        Send to custom toaster
      </Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </div>
  )
}
