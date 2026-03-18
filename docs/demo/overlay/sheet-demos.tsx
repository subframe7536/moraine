import { For, createSignal } from 'solid-js'

import { Button, Sheet } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const SIDES = ['left', 'right', 'top', 'bottom'] as const

export default () => {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <DemoPage componentKey="sheet">
      <DemoSection title="Sides" description="Open sheet from each side with shared shell slots.">
        <div class="flex flex-wrap gap-3 items-center">
          <For each={SIDES}>
            {(side) => (
              <Sheet
                side={side}
                title={`Sheet ${side}`}
                description={`This sheet opens from ${side}.`}
                body={<p class="text-sm text-zinc-700">Body content from {side} side.</p>}
              >
                <Button variant="outline" size="sm">
                  {side}
                </Button>
              </Sheet>
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection
        title="Inset + Close Variants"
        description="Inset layout with custom close content or hidden close control."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Sheet
            inset
            title="Inset sheet"
            close={<span class="text-xs font-semibold">Done</span>}
            body="Inset sheet with custom close content."
          >
            <Button variant="secondary">Inset + custom close</Button>
          </Sheet>

          <Sheet
            title="No close button"
            close={false}
            body="Close button is hidden for this sheet."
          >
            <Button variant="outline">Close=false</Button>
          </Sheet>
        </div>
      </DemoSection>

      <DemoSection
        title="Dismiss Control"
        description="Prevent close on outside interaction and Escape while counting attempts."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Sheet
            defaultOpen
            dismissible={false}
            onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
            title="Persistent sheet"
            body={
              <p class="text-sm text-zinc-700">
                Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
              </p>
            }
          >
            <Button variant="outline">Dismiss blocked</Button>
          </Sheet>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
