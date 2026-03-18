import { For } from 'solid-js'

import { Kbd } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const VARIANTS = ['outline', 'default', 'invert'] as const

export default () => (
  <DemoPage componentKey="kbd">
    <DemoSection title="Sizes" description="Keycap sizes from xs to xl.">
      <div class="flex flex-wrap gap-3 items-center">
        <For each={SIZES}>{(size) => <Kbd size={size} value={[size.toUpperCase()]} />}</For>
      </div>
    </DemoSection>

    <DemoSection title="Variants" description="Outline, default, and invert visual modes.">
      <div class="flex flex-wrap gap-3 items-center">
        <For each={VARIANTS}>{(variant) => <Kbd variant={variant} value={[variant]} />}</For>
      </div>
    </DemoSection>

    <DemoSection title="Shortcut Composition" description="Inline command palette hints.">
      <p class="text-sm text-zinc-700 flex flex-wrap gap-2 items-center">
        Open command palette
        <Kbd value={['Ctrl', 'K']} between={<div>+</div>} />
      </p>
    </DemoSection>
  </DemoPage>
)
