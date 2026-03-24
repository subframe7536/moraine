import 'solid-toaster/style.css'

import { createSignal } from 'solid-js'
import { Toaster, toast } from 'solid-toaster'
import { SourceCode } from 'virtual:demo-source'

import { Button } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const TOAST_PAGE_DOC = {
  component: {
    key: 'toast',
    name: 'Toast',
    category: 'overlays',
    description:
      'solid-toaster integration guide with real runtime examples, including promise and scoped instances.',
    polymorphic: false,
  },
  slots: [],
  props: {
    own: [],
    inherited: [],
  },
}

function BasicToasts() {
  const runLoadingToast = async () => {
    const id = toast.loading('Uploading files...')
    await wait(1200)
    toast.success('Upload complete', { id })
  }

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

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

function PromiseScopedInstances() {
  const [promiseRuns, setPromiseRuns] = createSignal(0)

  const runPromiseToast = () => {
    const nextRun = promiseRuns() + 1
    setPromiseRuns(nextRun)
    const request = wait(1400).then(() => ({ run: nextRun }))

    toast.promise(request, {
      loading: `Sync #${nextRun} in progress...`,
      success: (result) => `Sync #${result.run} finished`,
      error: (error) => `Sync failed: ${String(error)}`,
      duration: 1e6,
    })
  }

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  return (
    <div class="flex flex-wrap gap-3 items-center">
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

export default () => {
  return (
    <DemoPage componentKey="toaster" apiDoc={TOAST_PAGE_DOC}>
      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xs text-muted-foreground tracking-[0.18em] font-semibold uppercase">
            Setup
          </h2>
          <p class="text-sm text-muted-foreground">
            Install solid-toaster, import styles, mount one or more Toaster instances.
          </p>
        </div>
        <div class="max-w-3xl space-y-3">
          <SourceCode lang="bash">bun add solid-toaster</SourceCode>
          <SourceCode lang="tsx">{`import 'solid-toaster/style.css'

import { Toaster, toast } from 'solid-toaster'

export default function App() {
  return (
    <>
      <button onClick={() => toast.success('Saved!')}>Toast</button>
      <Toaster
        preventDuplicate
        style={{
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        }}
      />
    </>
  )
}`}</SourceCode>
        </div>
      </section>

      <DemoSection
        title="Basic Toasts"
        description="Send status toasts to the global toaster instance, including loading to success update."
        demo={BasicToasts}
      />

      <DemoSection
        title="Promise + Scoped Instances"
        description="Use toast.promise for async lifecycle and route toasts by toasterId."
        demo={PromiseScopedInstances}
      />

      <Toaster
        preventDuplicate
        style={{
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        }}
        visibleToasts={4}
      />
      <Toaster
        id="custom"
        position="bottom-left"
        style={{
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        }}
      />
    </DemoPage>
  )
}
