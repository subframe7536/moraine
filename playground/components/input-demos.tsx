import { For, createSignal } from 'solid-js'

import { Input, Textarea } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const VARIANTS = ['outline', 'soft', 'subtle', 'ghost', 'none'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export const InputDemos = () => {
  const [textareaValue, setTextareaValue] = createSignal('Type here to see autoresize...')

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Input & Textarea"
      description="Text input with icon slots, plus textarea variants, sizes, and autoresize."
    >
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
          <Input leading="i-lucide-search" placeholder="Search..." />
          <Input leading="i-lucide-mail" trailing="i-lucide-check" placeholder="Email" />
          <Input trailing={<span class="text-xs text-zinc-400">.com</span>} placeholder="Domain" />
          <Input
            leading={
              <div class="text-zinc-500 flex gap-1 items-center">
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

      <DemoSection title="Input States" description="Loading, disabled, and file type.">
        <div class="gap-3 grid sm:grid-cols-2">
          <Input loading placeholder="Loading..." />
          <Input disabled placeholder="Disabled" value="Cannot edit" />
          <Input type="file" />
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
          <p class="text-xs text-zinc-500">Characters: {textareaValue().length}</p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
