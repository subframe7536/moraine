import { For, createSignal } from 'solid-js'

import { Icon } from '../../../src'
import { Button } from '../../../src/elements/button/button'
import type { ButtonT } from '../../../src/elements/button/button'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Variants() {
  const VARIANTS: ButtonT.Variant['variant'][] = [
    'default',
    'secondary',
    'outline',
    'ghost',
    'link',
    'destructive',
  ]

  return (
    <div class="flex flex-wrap gap-3">
      <For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
    </div>
  )
}

function Sizes() {
  const SIZES: ButtonT.Variant['size'][] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIZES}>
        {(size) => (
          <Button size={size} variant="outline" leading="i-lucide:square">
            {size}
          </Button>
        )}
      </For>
    </div>
  )
}

function IconButtons() {
  const ICON_SIZES: NonNullable<ButtonT.Variant['size']>[] = [
    'icon-xs',
    'icon-sm',
    'icon-md',
    'icon-lg',
    'icon-xl',
  ]

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={ICON_SIZES}>
        {(size) => (
          <Button size={size} variant="secondary" aria-label={`Icon ${size}`}>
            <Icon name="i-lucide:star" />
          </Button>
        )}
      </For>
      <Button
        variant="outline"
        leading={<div class="i-lucide:arrow-left" />}
        trailing={<div class="i-lucide:arrow-right" />}
      >
        Leading + trailing
      </Button>
    </div>
  )
}

function LoadingStates() {
  const [manualLoading, setManualLoading] = createSignal(false)
  const [autoRuns, setAutoRuns] = createSignal(0)

  const runManualLoading = async () => {
    setManualLoading(true)
    await wait(1000)
    setManualLoading(false)
  }

  const onClickWait = async () => {
    await wait(2000)
    setAutoRuns((value) => value + 1)
  }

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        loading={manualLoading()}
        onclick={runManualLoading}
        leading={<div class="i-lucide:loader-circle animate-loading" />}
      >
        {manualLoading() ? 'Processing...' : 'Manual loading'}
      </Button>

      <Button
        loadingAuto
        variant="outline"
        leading="i-lucide:a-arrow-up"
        trailing="i-lucide:timer"
        onClick={onClickWait}
      >
        Async auto-loading ({autoRuns()})
      </Button>

      <Button disabled variant="ghost">
        Disabled
      </Button>
    </div>
  )
}

function Polymorphic() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button as="a" href="https://www.solidjs.com" target="_blank" rel="noreferrer" variant="link">
        SolidJS docs
      </Button>
      <Button
        as="a"
        href="https://kobalte.dev"
        target="_blank"
        rel="noreferrer"
        variant="secondary"
      >
        Kobalte
      </Button>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="button">
      <DemoSection
        title="Variants"
        description="Visual variants from the Rock UI button class contract."
        demo={Variants}
      />

      <DemoSection
        title="Sizes"
        description="Text button sizes with a leading icon to preview spacing."
        demo={Sizes}
      />

      <DemoSection
        title="Icon Buttons"
        description="Icon-only sizes and variants."
        demo={IconButtons}
      />

      <DemoSection
        title="Loading States"
        description="Controlled loading and async auto-loading from click handlers."
        demo={LoadingStates}
      />

      <DemoSection
        title="Polymorphic"
        description="Anchor rendering support via the polymorphic as prop."
        demo={Polymorphic}
      />
    </DemoPage>
  )
}
