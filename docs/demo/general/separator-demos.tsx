import { For } from 'solid-js'

import { Separator } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Types() {
  const TYPES = ['solid', 'dashed', 'dotted'] as const

  return (
    <div class="space-y-4">
      <For each={TYPES}>
        {(type) => (
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground tracking-wider uppercase">{type}</p>
            <Separator type={type} />
          </div>
        )}
      </For>
    </div>
  )
}

function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="space-y-4">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground tracking-wider uppercase">{size}</p>
            <Separator size={size} />
          </div>
        )}
      </For>
    </div>
  )
}

function WithContentVertical() {
  return (
    <div class="space-y-6">
      <Separator>
        <span class="text-xs text-muted-foreground">OR</span>
      </Separator>

      <div class="flex gap-4 h-20 items-center">
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Center</span>
        <Separator orientation="vertical" type="dashed" classes={{ root: 'text-primary' }} />
        <span>Right</span>
      </div>
    </div>
  )
}

export default () => (
  <DemoPage componentKey="separator">
    <DemoSection
      title="Types"
      description="Solid, dashed, and dotted divider styles."
      demo={Types}
    />

    <DemoSection title="Sizes" description="Border thickness variants." demo={Sizes} />

    <DemoSection
      title="With Content + Vertical"
      description="Inline content and vertical separators in flexible layouts."
      demo={WithContentVertical}
    />
  </DemoPage>
)
