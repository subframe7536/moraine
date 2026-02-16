import { For, createSignal } from 'solid-js'

import { Input, Textarea } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const VARIANTS = ['outline', 'soft', 'subtle', 'ghost', 'none'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const COLORS = ['primary', 'secondary', 'neutral', 'error'] as const

export const InputDemos = () => {
  const [textareaValue, setTextareaValue] = createSignal('Type here to see autoresize...')

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Input & Textarea"
      description="Text input and textarea with variants, sizes, colors, icon slots, and autoresize."
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

      <DemoSection title="Input Colors" description="Color variants with highlight ring.">
        <div class="gap-3 grid sm:grid-cols-2">
          <For each={COLORS}>
            {(color) => <Input color={color} highlight placeholder={`Color: ${color}`} />}
          </For>
        </div>
      </DemoSection>

      <DemoSection title="Input with Icons" description="Leading and trailing icon slots.">
        <div class="gap-3 grid sm:grid-cols-2">
          <Input icon="i-lucide-search" placeholder="Search..." />
          <Input leadingIcon="i-lucide-mail" trailingIcon="i-lucide-check" placeholder="Email" />
          <Input trailing={<span class="text-xs text-zinc-400">.com</span>} placeholder="Domain" />
          <Input
            leading={
              <div class="text-xs text-zinc-500 ps-2 flex gap-1 items-center">
                <div class="i-lucide-globe size-3.5" />
                https://
              </div>
            }
            placeholder="website.com"
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

      <DemoSection title="Textarea with Icons" description="Leading and trailing icon slots.">
        <div class="gap-3 grid sm:grid-cols-2">
          <Textarea
            leadingIcon="i-lucide-message-square"
            placeholder="Write a comment..."
            rows={2}
          />
          <Textarea trailingIcon="i-lucide-send" placeholder="Send a message..." rows={2} />
        </div>
      </DemoSection>
    </DemoPage>
  )
}
