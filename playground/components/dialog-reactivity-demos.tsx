import { createRenderEffect, createSignal } from 'solid-js'

import { Button, DropdownMenu } from '../../src'
import type { DropdownMenuItems } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const LABEL_OPTIONS = ['Deploy preview', 'Ship hotfix', 'Publish docs']
const DESCRIPTION_OPTIONS = [
  'Only the description subtree should react to this change.',
  'Description updated independently from the rest of the menu item.',
  'Fine-grained updates should leave the label, badge, and icon alone.',
]
const BADGE_OPTIONS = ['Draft', 'Ready', 'Live']
const ICON_OPTIONS = ['DP', 'HF', 'DS']

const getNextValue = (options: string[], current: string) => {
  const currentIndex = options.indexOf(current)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0

  return options[nextIndex] ?? options[0]
}

const ReactivityTextProbe = (props: { label: string; value: () => string; class?: string }) => {
  const [renderCount, setRenderCount] = createSignal(0)
  let executions = 0

  createRenderEffect(() => {
    const nextValue = props.value()
    executions += 1
    setRenderCount(executions)
    console.log(`[Dropdown Menu fine-grained] ${props.label} render #${executions}`, nextValue)
  })

  return (
    <span class={`flex flex-col gap-1 min-w-0 ${props.class ?? ''}`}>
      <span class="truncate">{props.value()}</span>
      <span class="text-[11px] text-emerald-700 font-medium">
        {props.label} renders: {renderCount()}
      </span>
    </span>
  )
}

const ReactivityBadgeProbe = (props: { value: () => string }) => {
  const [renderCount, setRenderCount] = createSignal(0)
  let executions = 0

  createRenderEffect(() => {
    const nextValue = props.value()
    executions += 1
    setRenderCount(executions)
    console.log(`[Dropdown Menu fine-grained] badge render #${executions}`, nextValue)
  })

  return (
    <span class="text-left flex shrink-0 flex-col gap-1 items-start">
      <span class="text-[11px] text-sky-700 font-medium px-1.5 py-0.5 rounded-md bg-sky-100">
        {props.value()}
      </span>
      <span class="text-[11px] text-emerald-700 font-medium">Badge renders: {renderCount()}</span>
    </span>
  )
}

const ReactivityIconProbe = (props: { value: () => string }) => {
  const [renderCount, setRenderCount] = createSignal(0)
  let executions = 0

  createRenderEffect(() => {
    const nextValue = props.value()
    executions += 1
    setRenderCount(executions)
    console.log(`[Dropdown Menu fine-grained] icon render #${executions}`, nextValue)
  })

  return (
    <span class="leading-none flex flex-col gap-1 items-center">
      <span class="text-[8px] text-white font-semibold rounded-md bg-zinc-900 grid size-4 place-items-center">
        {props.value()}
      </span>
      <span class="text-[8px] text-emerald-700 font-medium">{renderCount()}</span>
    </span>
  )
}

export const DropdownMenuReactivityDemos = () => {
  const [open, setOpen] = createSignal(false)
  const [lastAction, setLastAction] = createSignal('None')
  const [reactiveLabel, setReactiveLabel] = createSignal(LABEL_OPTIONS[0]!)
  const [reactiveDescription, setReactiveDescription] = createSignal(DESCRIPTION_OPTIONS[0]!)
  const [reactiveBadge, setReactiveBadge] = createSignal(BADGE_OPTIONS[0]!)
  const [reactiveIcon, setReactiveIcon] = createSignal(ICON_OPTIONS[0]!)

  const resetDemo = () => {
    setOpen(true)
    setLastAction('Reset demo')
    setReactiveLabel(LABEL_OPTIONS[0]!)
    setReactiveDescription(DESCRIPTION_OPTIONS[0]!)
    setReactiveBadge(BADGE_OPTIONS[0]!)
    setReactiveIcon(ICON_OPTIONS[0]!)
  }

  const items: DropdownMenuItems = [
    [
      { type: 'label', label: 'Reactivity Lab' },
      {
        label: (
          <div class="flex gap-2 min-w-0 items-start">
            <ReactivityTextProbe
              label="Item label"
              value={reactiveLabel}
              class="font-medium text-left"
            />
            <ReactivityBadgeProbe value={reactiveBadge} />
          </div>
        ),
        description: (
          <ReactivityTextProbe
            label="Item description"
            value={reactiveDescription}
            class="text-zinc-500 text-left"
          />
        ),
        icon: <ReactivityIconProbe value={reactiveIcon} />,
        onSelect: () => setLastAction(`Selected ${reactiveLabel()}`),
      },
      {
        label: 'Static sibling item',
        description: 'Use this row as a baseline while the dynamic row updates.',
        onSelect: () => setLastAction('Selected static sibling item'),
      },
    ],
    [
      {
        label: 'Reset from menu',
        onSelect: resetDemo,
      },
    ],
  ]

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Dropdown Menu Reactivity"
      description="Standalone dropdown menu playground for checking that dynamic item content only re-renders where its own reactive signal is consumed."
    >
      <DemoSection
        title="Dynamic Menu Item"
        description="This page isolates a single dropdown item with reactive label, description, badge, and icon content. Update any signal and watch the counters plus console logs to confirm fine-grained behavior."
      >
        <div class="space-y-4">
          <p class="text-sm text-zinc-600 max-w-2xl">
            Keep the menu open while updating the controls below. The dynamic item should refresh
            only the affected subtree, while the static sibling item remains unchanged.
          </p>

          <div class="flex flex-wrap gap-2 items-center">
            <Button size="sm" onclick={() => setOpen(true)}>
              {open() ? 'Menu open' : 'Open menu'}
            </Button>
            <Button size="sm" variant="outline" onclick={() => setOpen(false)}>
              Close programmatically
            </Button>
            <Button size="sm" variant="ghost" onclick={resetDemo}>
              Reset demo
            </Button>
            <span class="text-xs text-zinc-600">State: {open() ? 'open' : 'closed'}</span>
            <span class="text-xs text-zinc-600">Last action: {lastAction()}</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onclick={() => setReactiveLabel((value) => getNextValue(LABEL_OPTIONS, value))}
            >
              Update label
            </Button>
            <Button
              size="sm"
              variant="outline"
              onclick={() =>
                setReactiveDescription((value) => getNextValue(DESCRIPTION_OPTIONS, value))
              }
            >
              Update description
            </Button>
            <Button
              size="sm"
              variant="outline"
              onclick={() => setReactiveBadge((value) => getNextValue(BADGE_OPTIONS, value))}
            >
              Update badge
            </Button>
            <Button
              size="sm"
              variant="outline"
              onclick={() => setReactiveIcon((value) => getNextValue(ICON_OPTIONS, value))}
            >
              Update icon
            </Button>
          </div>

          <DropdownMenu
            modal={false}
            open={open()}
            // onOpenChange={setOpen}
            items={items}
            classes={{ content: 'sm:min-w-96' }}
          >
            anchor
          </DropdownMenu>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
