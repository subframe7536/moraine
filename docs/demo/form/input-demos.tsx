import { For, createSignal } from 'solid-js'

import { Input, Textarea } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export default () => {
  const [textareaValue, setTextareaValue] = createSignal('Type here to see autoresize...')
  const [composerValue, setComposerValue] = createSignal('Hello Rock UI!')

  return (
    <DemoPage componentKey="input">
      <DemoSection title="Input Variants" description="Visual style variants.">
        <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
          <For each={VARIANTS}>
            {(variant) => <Input variant={variant} placeholder={variant} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Input Sizes" description="From xs to xl.">
        <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
          <For each={SIZES}>{(size) => <Input size={size} placeholder={`Size: ${size}`} />}</For>
        </div>
      </DemoSection>

      <DemoSection title="Input with Icons" description="Leading and trailing icon slots.">
        <div class="gap-3 grid sm:grid-cols-2">
          <Input
            leading="i-lucide-search"
            placeholder="Search..."
            classes={{ leading: 'bg-muted p-3' }}
          />
          <Input leading="i-lucide-mail" trailing="i-lucide-check" placeholder="Email" />
          <Input
            trailing={<span class="text-xs text-muted-foreground/80">.com</span>}
            placeholder="Domain"
          />
          <Input
            leading={
              <div class="text-muted-foreground flex gap-1 items-center">
                <div class="i-lucide-globe" />
                https://
              </div>
            }
            placeholder="website.com"
            classes={{
              input: 'ps-0',
            }}
          />
        </div>
      </DemoSection>

      <DemoSection title="Input States" description="Loading, disabled, and type.">
        <div class="gap-3 grid sm:grid-cols-2">
          <Input loading placeholder="Loading..." />
          <Input disabled placeholder="Disabled" value="Cannot edit" />
          <Input type="file" />
          <Input type="datetime-local" />
        </div>
      </DemoSection>

      <DemoSection title="Textarea Variants" description="Same visual variants as Input.">
        <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
          <For each={VARIANTS}>
            {(variant) => <Textarea variant={variant} placeholder={variant} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Textarea Sizes" description="From xs to xl.">
        <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
          <For each={SIZES}>
            {(size) => <Textarea size={size} placeholder={`Size: ${size}`} rows={2} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Textarea Autoresize" description="Grows with content up to maxrows.">
        <div class="max-w-md space-y-2">
          <Textarea
            autoresize
            maxrows={6}
            value={textareaValue()}
            onValueChange={setTextareaValue}
            placeholder="Start typing..."
          />
          <p class="text-xs text-muted-foreground">Characters: {textareaValue().length}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Textarea Header/Footer"
        description="Block-start and block-end addons via header/footer slots."
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
              header: 'border-b border-border',
              input: 'min-h-24',
            }}
          />

          <Textarea
            value={composerValue()}
            onValueChange={(nextValue) => setComposerValue(String(nextValue ?? ''))}
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

          <Textarea
            placeholder="console.log('Hello, world!');"
            header={
              <>
                <span class="i-lucide-code text-base" />
                <span>script.js</span>
              </>
            }
            footer={
              <>
                <span>Line 1, Column 1</span>
                <span class="ms-auto">JavaScript</span>
              </>
            }
            classes={{
              header: 'b-(b border)',
              footer: 'b-(t border)',
              input: 'min-h-28',
            }}
          />
        </div>
      </DemoSection>
    </DemoPage>
  )
}
