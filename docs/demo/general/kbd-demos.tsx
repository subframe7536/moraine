import { For } from 'solid-js'

import { Kbd } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIZES}>{(size) => <Kbd size={size} value={[size.toUpperCase()]} />}</For>
    </div>
  )
}

function Variants() {
  const VARIANTS = ['outline', 'default', 'invert'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={VARIANTS}>{(variant) => <Kbd variant={variant} value={[variant]} />}</For>
    </div>
  )
}

function ShortcutComposition() {
  return (
    <p class="text-sm text-foreground flex flex-wrap gap-2 items-center">
      Open command palette
      <Kbd value={['Ctrl', 'K']} between={<div>+</div>} />
    </p>
  )
}

export default () => (
  <DemoPage componentKey="kbd">
    <DemoSection title="Sizes" description="Keycap sizes from xs to xl." demo={Sizes} />

    <DemoSection
      title="Variants"
      description="Outline, default, and invert visual modes."
      demo={Variants}
    />

    <DemoSection
      title="Shortcut Composition"
      description="Inline command palette hints."
      demo={ShortcutComposition}
    />
  </DemoPage>
)
