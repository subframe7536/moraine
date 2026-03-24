import { createSignal, For } from 'solid-js'

import { Button, Switch, Tooltip } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Placements() {
  const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <For each={PLACEMENTS}>
        {(placement) => (
          <Tooltip text={`Tooltip on ${placement}`} placement={placement}>
            <Button variant="outline">{placement}</Button>
          </Tooltip>
        )}
      </For>
    </div>
  )
}

function KeyboardShortcuts() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="Save" kbds={['Ctrl', 'S']} open>
        <Button variant="outline" leading={<div class="i-lucide-save" />}>
          Save
        </Button>
      </Tooltip>
      <Tooltip text="Undo" kbds={['Ctrl', 'Z']}>
        <Button variant="outline" leading={<div class="i-lucide-undo" />}>
          Undo
        </Button>
      </Tooltip>
      <Tooltip text="Search" kbds={['Ctrl', 'K']}>
        <Button variant="outline" leading={<div class="i-lucide-search" />}>
          Search
        </Button>
      </Tooltip>
    </div>
  )
}

function TriggerTypes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="Button trigger">
        <Button>Hover me</Button>
      </Tooltip>
      <p class="text-sm text-foreground">
        Hover over this{' '}
        <Tooltip text="Inline tooltip">
          <span class="font-medium underline cursor-help">underlined text</span>
        </Tooltip>{' '}
        to see a tooltip.
      </p>
    </div>
  )
}

function TextOnlyVsShortcutsOnly() {
  const [invert, setInvert] = createSignal(false)

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip invert={invert()} text="Just a message">
        <Button variant="outline">Text only</Button>
      </Tooltip>
      <Tooltip invert={invert()} kbds={['Ctrl', 'Shift', 'P']}>
        <Button variant="outline">Shortcuts only</Button>
      </Tooltip>
      <Tooltip invert={invert()} text="Command palette" kbds={['Ctrl', 'Shift', 'P']}>
        <Button variant="outline">Both</Button>
      </Tooltip>
      <Switch checked={invert()} onChange={setInvert} label="Invert" />
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="tooltip">
      <DemoSection
        title="Placements"
        description="Tooltip positioned on each side."
        demo={Placements}
      />

      <DemoSection
        title="Keyboard Shortcuts"
        description="Display keyboard shortcut hints alongside tooltip text."
        demo={KeyboardShortcuts}
      />

      <DemoSection
        title="Trigger Types"
        description="Tooltip on buttons and inline text."
        demo={TriggerTypes}
      />

      <DemoSection
        title="Text Only vs Shortcuts Only"
        description="Content variations."
        demo={TextOnlyVsShortcutsOnly}
      />
    </DemoPage>
  )
}
