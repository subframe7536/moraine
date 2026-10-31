import { AlertDialog, Badge, Button } from '@src'
import { createSignal, onCleanup, Show } from 'solid-js'

export function AlertPublish() {
  const [stage, setStage] = createSignal<'running' | 'passed' | 'published'>('running')
  const [publishedAt, setPublishedAt] = createSignal<string>()
  let timer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })

  const reset = () => {
    if (timer) {
      clearTimeout(timer)
    }
    setStage('running')
    setPublishedAt(undefined)
  }

  const publishRelease = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setStage('published')
    setPublishedAt(new Date().toLocaleTimeString())
  }

  const publish = () => {
    if (stage() === 'passed') {
      void AlertDialog.confirm({
        title: 'Publish release v2.4.0?',
        description: 'All 18 automated checks passed. Ready to deploy to production.',
        width: 440,
        action: { label: 'Publish release', onClick: publishRelease },
        cancel: { label: 'Cancel' },
      })
      return
    }

    const dialog = AlertDialog.confirm({
      title: 'Publish release v2.4.0?',
      description:
        'Automated checks are still running (1 pending: e2e-regression). Publishing now will bypass remaining verification.',
      danger: true,
      width: 440,
      action: { label: 'Publish anyway', onClick: publishRelease },
      cancel: { label: 'Wait for checks' },
    })

    let settled = false
    void dialog.result().then(() => {
      settled = true
      if (timer) {
        clearTimeout(timer)
      }
    })

    timer = setTimeout(() => {
      setStage('passed')
      if (settled) {
        return
      }
      dialog.update({
        title: 'All checks passed — Publish release v2.4.0?',
        description:
          'Automated checks finished successfully (18/18 passed). Ready to deploy to production.',
        danger: false,
        action: { label: 'Publish release', onClick: publishRelease },
        cancel: { label: 'Cancel' },
      })
    }, 2000)
  }

  return (
    <div class="p-4 b-1 b-border rounded-xl bg-card/50 flex flex-col gap-3 max-w-lg w-full">
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="text-sm font-semibold">Release v2.4.0</span>
          <Show when={stage() === 'running'}>
            <Badge variant="soft" tone="warning">
              <span class="mr-1 rounded-full bg-warning size-1.5 inline-block animate-pulse" />1
              check running
            </Badge>
          </Show>
          <Show when={stage() === 'passed'}>
            <Badge variant="soft" tone="success">
              <span class="mr-1 rounded-full bg-success size-1.5 inline-block" />
              All checks passed
            </Badge>
          </Show>
          <Show when={stage() === 'published'}>
            <Badge variant="solid">Published</Badge>
          </Show>
        </div>
        <span class="text-xs text-muted-foreground font-mono">main@8f3a1d</span>
      </div>

      <p class="text-xs text-muted-foreground">
        <Show when={stage() === 'running'}>
          Pipeline: Unit tests & build passed, E2E regression check in progress (~2s).
        </Show>
        <Show when={stage() === 'passed'}>
          Pipeline: 18/18 tests passed. Artifact verified for production deployment.
        </Show>
        <Show when={stage() === 'published'}>
          Deployed to production cluster (us-east-1) at {publishedAt()}.
        </Show>
      </p>

      <div class="pt-2 b-border b-t-1 flex items-center justify-between">
        <div class="text-xs text-muted-foreground">
          <Show when={stage() === 'running'}>
            Click publish to open confirmation while checks run.
          </Show>
          <Show when={stage() === 'passed'}>Checks completed. Safe to deploy.</Show>
          <Show when={stage() === 'published'}>Release live in production.</Show>
        </div>
        <div class="flex gap-2 items-center">
          <Show when={stage() !== 'running'}>
            <Button size="sm" variant="ghost" onClick={reset}>
              Reset demo
            </Button>
          </Show>
          <Button
            size="sm"
            variant={stage() === 'published' ? 'outline' : 'solid'}
            disabled={stage() === 'published'}
            leading={stage() === 'published' ? 'i-lucide:check' : 'i-lucide:rocket'}
            onClick={publish}
          >
            {stage() === 'published' ? 'Deployed' : 'Publish release'}
          </Button>
        </div>
      </div>
    </div>
  )
}
