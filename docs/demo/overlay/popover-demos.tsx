import { For, createSignal } from 'solid-js'

import { Button, Popover } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Placement() {
  const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={PLACEMENTS}>
        {(placement) => (
          <Popover
            placement={placement}
            content={
              <div class="space-y-1">
                <p class="text-sm font-medium capitalize">{placement}</p>
                <p class="text-xs text-muted-foreground">Popover content aligned to {placement}.</p>
              </div>
            }
          >
            <Button variant="outline" size="sm">
              {placement}
            </Button>
          </Popover>
        )}
      </For>
    </div>
  )
}

function HoverMode() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Popover
        mode="hover"
        openDelay={180}
        closeDelay={120}
        content={
          <div class="space-y-1">
            <p class="text-sm font-medium">Hover Card</p>
            <p class="text-xs text-muted-foreground">
              This popover opens on hover and closes after delay.
            </p>
          </div>
        }
      >
        <Button variant="outline">Hover me</Button>
      </Popover>
    </div>
  )
}

function DismissControl() {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Popover
        defaultOpen
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
        content={
          <div class="space-y-1">
            <p class="text-sm font-medium">Persistent popover</p>
            <p class="text-xs text-muted-foreground">
              Prevented close attempts: {preventedCloseCount()}
            </p>
          </div>
        }
      >
        <Button variant="secondary">Try close me</Button>
      </Popover>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="popover">
      <DemoSection
        title="Placement"
        description="Click trigger with four placement variants."
        demo={Placement}
      />

      <DemoSection
        title="Hover Mode"
        description="Hover-based popover using open and close delays."
        demo={HoverMode}
      />

      <DemoSection
        title="Dismiss Control"
        description="Prevent closing on outside interaction and Escape key."
        demo={DismissControl}
      />
    </DemoPage>
  )
}
