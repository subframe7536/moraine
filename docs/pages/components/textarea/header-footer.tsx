import { Button, Icon, InputGroup, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function HeaderFooter() {
  const [value, setValue] = createSignal('Hello Moraine!')

  return (
    <div class="gap-6 grid w-full lg:grid-cols-3">
      <InputGroup orientation="vertical">
        <InputGroup.Leading class="border-b border-border">
          <span class="font-semibold">Info text</span>
          <Icon name="i-lucide:info" class="text-base ms-auto" />
        </InputGroup.Leading>
        <Textarea placeholder="Ask, search or chat..." class="min-h-24" />
      </InputGroup>
      <InputGroup orientation="vertical">
        <Textarea
          value={value()}
          onValueChange={(next) => setValue(next ?? '')}
          placeholder="Write your message..."
          autoResize
          class="min-h-24"
        />
        <InputGroup.Trailing class="border-t border-border">
          <span>{value().length}/280 characters</span>
          <Button type="button" size="sm" class="ms-auto">
            Send
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup orientation="vertical">
        <InputGroup.Leading class="border-b border-border">
          <Icon name="i-lucide:code" class="text-base" />
          <span>script.js</span>
        </InputGroup.Leading>
        <Textarea placeholder="console.log('Hello, world!');" class="min-h-28" />
        <InputGroup.Trailing class="border-t border-border">
          <span>Line 1, Column 1</span>
          <span class="ms-auto">JavaScript</span>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
