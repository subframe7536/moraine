import { For, createSignal } from 'solid-js'

import { Button, Popup } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const SCROLLABLE_LINES = Array.from({ length: 48 }, (_, index) => `Popup line ${index + 1}`)

export default () => {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <DemoPage componentKey="popup">
      <DemoSection
        title="Default Container"
        description="Popup provides only container + overlay. Content styling is fully custom."
      >
        <Popup
          content={
            <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
              <h3 class="text-sm font-semibold">Popup content</h3>
              <p class="text-sm text-muted-foreground mt-1">
                This content controls its own spacing and visuals.
              </p>
            </div>
          }
        >
          <Button>Open popup</Button>
        </Popup>
      </DemoSection>

      <DemoSection
        title="Scrollable Overlay Mode"
        description="Scrollable overlay keeps content in flow while preserving the backdrop."
      >
        <Popup
          scrollable
          content={
            <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
              <h3 class="text-sm font-semibold">Scrollable Popup</h3>
              <div class="mt-2 space-y-1">
                <For each={SCROLLABLE_LINES}>
                  {(line) => <p class="text-sm text-zinc-700">{line}</p>}
                </For>
              </div>
            </div>
          }
        >
          <Button variant="outline">Open scrollable popup</Button>
        </Popup>
      </DemoSection>

      <DemoSection
        title="Dismiss Control"
        description="Block outside dismiss and count prevent-close attempts."
      >
        <Popup
          dismissible={false}
          onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
          content={
            <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
              <h3 class="text-sm font-semibold">Persistent popup</h3>
              <p class="text-sm text-muted-foreground mt-1">Refresh to dismiss</p>
              <p class="text-sm text-muted-foreground mt-1">
                Prevented close attempts: {preventedCloseCount()}
              </p>
            </div>
          }
        >
          <Button variant="secondary">Dismiss blocked</Button>
        </Popup>
      </DemoSection>
    </DemoPage>
  )
}
