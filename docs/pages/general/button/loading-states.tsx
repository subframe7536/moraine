import { Button } from '@src/elements/button/button'
import { createSignal } from 'solid-js'

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function LoadingStates() {
  const [controlledLoading, setControlledLoading] = createSignal(false)
  const [customLoading, setCustomLoading] = createSignal(false)
  const [autoRuns, setAutoRuns] = createSignal(0)

  const runControlledLoading = async () => {
    setControlledLoading(true)
    await wait(1000)
    setControlledLoading(false)
  }

  const runCustomLoading = async () => {
    setCustomLoading(true)
    await wait(1200)
    setCustomLoading(false)
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        loading={controlledLoading()}
        onClick={runControlledLoading}
        leading="i-lucide:download"
      >
        {controlledLoading() ? 'Downloading...' : 'Download report'}
      </Button>

      <Button
        loading={customLoading()}
        loadingIcon="i-lucide:loader-circle"
        variant="outline"
        onClick={runCustomLoading}
      >
        {customLoading() ? 'Syncing...' : 'Sync workspace'}
      </Button>

      <Button
        loadingAuto
        variant="outline"
        leading="i-lucide:send"
        onClick={() => {
          return wait(2000).then(() => {
            setAutoRuns((value) => value + 1)
          })
        }}
      >
        Send invite ({autoRuns()})
      </Button>

      <Button disabled variant="ghost">
        Archive project
      </Button>
    </div>
  )
}
