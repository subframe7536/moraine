import { For, createSignal } from 'solid-js'

import { Button, Dialog } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const SCROLLABLE_LINES = Array.from({ length: 16 }, (_, index) => `Release note line ${index + 1}`)

export default () => {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <DemoPage componentKey="dialog">
      <DemoSection
        title="Default Shell"
        description="Header, description, actions, body, and footer slots."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Dialog
            title="Delete Project"
            description="This action cannot be undone."
            body={
              <p class="text-sm text-zinc-700">
                The selected project and all related records will be permanently removed.
              </p>
            }
            footer={
              <>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Delete</Button>
              </>
            }
          >
            <Button>Open dialog</Button>
          </Dialog>
        </div>
      </DemoSection>

      <DemoSection
        title="Close Variants"
        description="`close` supports default button, hidden, and custom JSX content."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Dialog
            title="No close button"
            close={false}
            body="This dialog has no top-right close button."
          >
            <Button variant="outline">Close=false</Button>
          </Dialog>

          <Dialog
            title="Custom close"
            closeIcon={<span class="text-xs font-semibold size-full">Done</span>}
            body="Custom close content rendered in the close button."
          >
            <Button variant="outline">Custom close</Button>
          </Dialog>
        </div>
      </DemoSection>

      <DemoSection
        title="Scrollable + Dismissible Control"
        description="Scrollable body with prevent-close callback when dismiss is disabled."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Dialog
            scrollable
            title="Release Notes"
            description="Scrollable dialog content."
            body={
              <div class="space-y-1">
                <For each={SCROLLABLE_LINES}>
                  {(line) => <p class="text-sm text-zinc-700">{line}</p>}
                </For>
              </div>
            }
          >
            <Button variant="secondary">Scrollable dialog</Button>
          </Dialog>

          <Dialog
            defaultOpen
            dismissible={false}
            onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
            title="Persistent dialog"
            body={
              <p class="text-sm text-zinc-700">
                Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
              </p>
            }
          >
            <Button variant="outline">Dismiss blocked</Button>
          </Dialog>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
