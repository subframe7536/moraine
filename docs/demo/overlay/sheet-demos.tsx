import { For, createSignal } from 'solid-js'

import { Button, Sheet } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Sides() {
  const SIDES = ['left', 'right', 'top', 'bottom'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIDES}>
        {(side) => (
          <Sheet
            side={side}
            title={`Sheet ${side}`}
            description={`This sheet opens from ${side}.`}
            body={<p class="text-sm text-foreground">Body content from {side} side.</p>}
          >
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </Sheet>
        )}
      </For>
    </div>
  )
}

function InsetCloseVariants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet
        inset
        title="Inset sheet"
        close={<span class="text-xs font-semibold">Done</span>}
        body="Inset sheet with custom close content."
      >
        <Button variant="secondary">Inset + custom close</Button>
      </Sheet>

      <Sheet title="No close button" close={false} body="Close button is hidden for this sheet.">
        <Button variant="outline">Close=false</Button>
      </Sheet>
    </div>
  )
}

function DismissControl() {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet
        defaultOpen
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
        title="Persistent sheet"
        body={
          <p class="text-sm text-foreground">
            Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
          </p>
        }
      >
        <Button variant="outline">Dismiss blocked</Button>
      </Sheet>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="sheet">
      <DemoSection
        title="Sides"
        description="Open sheet from each side with shared shell slots."
        demo={Sides}
      />

      <DemoSection
        title="Inset + Close Variants"
        description="Inset layout with custom close content or hidden close control."
        demo={InsetCloseVariants}
      />

      <DemoSection
        title="Dismiss Control"
        description="Prevent close on outside interaction and Escape while counting attempts."
        demo={DismissControl}
      />
    </DemoPage>
  )
}
