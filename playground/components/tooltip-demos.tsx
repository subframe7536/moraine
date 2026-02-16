import { For } from 'solid-js'

import { Button, Tooltip } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const

export const TooltipDemos = () => (
  <DemoPage
    eyebrow="Rock UI Playground"
    title="Tooltip"
    description="Contextual information triggered on hover, with placement and keyboard shortcut support."
  >
    <DemoSection title="Placements" description="Tooltip positioned on each side.">
      <div class="flex flex-wrap gap-4 items-center">
        <For each={PLACEMENTS}>
          {(placement) => (
            <Tooltip text={`Tooltip on ${placement}`} placement={placement}>
              <Button variant="outline">{placement}</Button>
            </Tooltip>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection title="With Arrow" description="Arrow indicator pointing to the trigger.">
      <div class="flex flex-wrap gap-4 items-center">
        <For each={PLACEMENTS}>
          {(placement) => (
            <Tooltip text={`Arrow ${placement}`} arrow placement={placement}>
              <Button variant="secondary">{placement}</Button>
            </Tooltip>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection
      title="Keyboard Shortcuts"
      description="Display keyboard shortcut hints alongside tooltip text."
    >
      <div class="flex flex-wrap gap-4 items-center">
        <Tooltip text="Save" kbds={['Ctrl', 'S']}>
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
    </DemoSection>

    <DemoSection title="Trigger Types" description="Tooltip on buttons and inline text.">
      <div class="flex flex-wrap gap-4 items-center">
        <Tooltip text="Button trigger">
          <Button>Hover me</Button>
        </Tooltip>
        <p class="text-sm text-zinc-700">
          Hover over this{' '}
          <Tooltip text="Inline tooltip">
            <span class="font-medium border-b border-zinc-400 border-dashed cursor-help">
              underlined text
            </span>
          </Tooltip>{' '}
          to see a tooltip.
        </p>
      </div>
    </DemoSection>

    <DemoSection title="Text Only vs Shortcuts Only" description="Content variations.">
      <div class="flex flex-wrap gap-4 items-center">
        <Tooltip text="Just a message">
          <Button variant="outline">Text only</Button>
        </Tooltip>
        <Tooltip kbds={['Ctrl', 'Shift', 'P']}>
          <Button variant="outline">Shortcuts only</Button>
        </Tooltip>
        <Tooltip text="Command palette" kbds={['Ctrl', 'Shift', 'P']}>
          <Button variant="outline">Both</Button>
        </Tooltip>
      </div>
    </DemoSection>
  </DemoPage>
)
