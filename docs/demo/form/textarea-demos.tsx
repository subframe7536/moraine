import { For, createSignal } from 'solid-js'

import { Textarea } from '../../../src'
import type { TextareaT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Variants() {
  const VARIANTS: TextareaVariantName[] = ['outline', 'subtle', 'ghost', 'none']

  type TextareaVariantName = Exclude<TextareaT.Variant['variant'], undefined>

  return (
    <div class="gap-3 grid lg:grid-cols-4 sm:grid-cols-2">
      <For each={VARIANTS}>
        {(variant) => <Textarea variant={variant} placeholder={`Variant: ${variant}`} rows={2} />}
      </For>
    </div>
  )
}

function Sizes() {
  const SIZES: TextareaSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type TextareaSizeName = Exclude<TextareaT.Variant['size'], undefined>

  return (
    <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => <Textarea size={size} placeholder={`Size: ${size}`} rows={2} />}
      </For>
    </div>
  )
}

function AutoresizeHighlight() {
  const [value, setValue] = createSignal('Type here to see autoresize...')

  return (
    <div class="max-w-xl space-y-3">
      <Textarea
        autoresize
        maxrows={6}
        highlight
        value={value()}
        onValueChange={(next) => setValue(String(next ?? ''))}
        placeholder="Start typing..."
      />
      <p class="text-xs text-muted-foreground">Characters: {value().length}</p>
      <Textarea disabled value="Disabled textarea state" rows={2} />
    </div>
  )
}

function HeaderFooterComposition() {
  const [composerValue, setComposerValue] = createSignal('Ship docs refresh this week.')

  return (
    <div class="gap-3 grid lg:grid-cols-2">
      <Textarea
        placeholder="Ask, search or chat..."
        header={
          <>
            <span class="font-semibold">Info text</span>
            <span class="i-lucide-info text-base ms-auto" />
          </>
        }
        classes={{
          header: 'b-(b border)',
          input: 'min-h-24',
        }}
      />

      <Textarea
        value={composerValue()}
        onValueChange={(next) => setComposerValue(String(next ?? ''))}
        placeholder="Write your message..."
        autoresize
        footer={
          <>
            <span>{composerValue().length}/280 characters</span>
            <button
              type="button"
              class="text-xs text-primary-foreground ms-auto px-2 py-1 rounded-md bg-primary"
            >
              Send
            </button>
          </>
        }
        classes={{
          footer: 'b-(t border)',
          input: 'min-h-24',
        }}
      />
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="textarea">
      <DemoSection
        title="Variants"
        description="Outline/subtle/ghost/none visual variants."
        demo={Variants}
      />

      <DemoSection title="Sizes" description="Textarea size scale from xs to xl." demo={Sizes} />

      <DemoSection
        title="Autoresize + Highlight"
        description="Autoresize growth with maxrows and highlight state."
        demo={AutoresizeHighlight}
      />

      <DemoSection
        title="Header + Footer Composition"
        description="Build composer-like surfaces using header/footer slots."
        demo={HeaderFooterComposition}
      />
    </DemoPage>
  )
}
