import { For, createSignal } from 'solid-js'

import { Button } from '../../src/button/button'
import type { ButtonVariantProps } from '../../src/button/button.class'

import { DemoPage, DemoSection } from './common/demo-page'

type ButtonVariantName = Exclude<ButtonVariantProps['variant'], undefined>
type ButtonSizeName = Exclude<ButtonVariantProps['size'], undefined>

const VARIANTS: ButtonVariantName[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
]

const SIZES: ButtonSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']
const ICON_SIZES: ButtonSizeName[] = ['icon-xs', 'icon-sm', 'icon-md', 'icon-lg', 'icon-xl']

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export const ButtonDemos = () => {
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

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Button Demos"
      description="Standalone preview cases for variants, sizes, icon slots, and loading behavior."
    >
      <DemoSection
        title="Variants"
        description="Visual variants from the Rock UI button class contract."
      >
        <div class="flex flex-wrap gap-3">
          <For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
        </div>
      </DemoSection>

      <DemoSection
        title="Sizes"
        description="Text button sizes with a leading icon to preview spacing."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <For each={SIZES}>
            {(size) => (
              <Button size={size} variant="outline" leading={<div class="i-lucide:rocket" />}>
                {size}
              </Button>
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Icon Buttons" description="Icon-only sizes and variants.">
        <div class="flex flex-wrap gap-3 items-center">
          <For each={ICON_SIZES}>
            {(size) => (
              <Button size={size} variant="secondary" aria-label={`Icon ${size}`}>
                <div class="i-lucide:star" />
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
      </DemoSection>

      <DemoSection
        title="Loading States"
        description="Controlled loading and async auto-loading from click handlers."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            loading={manualLoading()}
            onclick={runManualLoading}
            leading={<div class="i-lucide:loader-circle animate-spin" />}
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
      </DemoSection>

      <DemoSection
        title="Polymorphic"
        description="Anchor rendering support via the polymorphic as prop."
      >
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            as="a"
            href="https://www.solidjs.com"
            target="_blank"
            rel="noreferrer"
            variant="link"
          >
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
      </DemoSection>
    </DemoPage>
  )
}
