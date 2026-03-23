import { For, createSignal } from 'solid-js'

import { Textarea } from '../../../src'
import type { TextareaVariantProps } from '../../../src/forms/textarea/textarea.class'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

type TextareaVariantName = Exclude<TextareaVariantProps['variant'], undefined>
type TextareaSizeName = Exclude<TextareaVariantProps['size'], undefined>

const VARIANTS: TextareaVariantName[] = ['outline', 'subtle', 'ghost', 'none']
const SIZES: TextareaSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

export default () => {
  const [value, setValue] = createSignal('Type here to see autoresize...')
  const [composerValue, setComposerValue] = createSignal('Ship docs refresh this week.')

  return (
    <DemoPage componentKey="textarea">
      <DemoSection title="Variants" description="Outline/subtle/ghost/none visual variants.">
        <div class="gap-3 grid lg:grid-cols-4 sm:grid-cols-2">
          <For each={VARIANTS}>
            {(variant) => (
              <Textarea variant={variant} placeholder={`Variant: ${variant}`} rows={2} />
            )}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Textarea size scale from xs to xl.">
        <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
          <For each={SIZES}>
            {(size) => <Textarea size={size} placeholder={`Size: ${size}`} rows={2} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection
        title="Autoresize + Highlight"
        description="Autoresize growth with maxrows and highlight state."
      >
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
      </DemoSection>

      <DemoSection
        title="Header + Footer Composition"
        description="Build composer-like surfaces using header/footer slots."
      >
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
      </DemoSection>
    </DemoPage>
  )
}
