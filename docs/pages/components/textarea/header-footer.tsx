import { Button, Icon, InputGroup, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function HeaderFooter() {
  const [value, setValue] = createSignal('Hello Moraine!')

  return (
    <div class="gap-6 grid w-full lg:grid-cols-3">
      <InputGroup orientation="vertical">
        <InputGroup.Leading>
          <span class="font-semibold">Info text</span>
          <Icon name="i-lucide:info" />
        </InputGroup.Leading>
        <Textarea placeholder="Ask, search or chat..." rows={3} />
      </InputGroup>
      <InputGroup orientation="vertical">
        <Textarea
          value={value()}
          onValueChange={(next) => setValue(next ?? '')}
          placeholder="Write your message..."
          autoResize
          rows={3}
        />
        <InputGroup.Trailing>
          <div class="flex w-full items-center justify-between">
            <span>{value().length}/280 characters</span>
            <Button type="button" size="sm">
              Send
            </Button>
          </div>
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup orientation="vertical">
        <InputGroup.Leading>
          <Icon name="i-lucide:code" />
          <span>script.js</span>
        </InputGroup.Leading>
        <Textarea placeholder="console.log('Hello, world!');" rows={4} />
        <InputGroup.Trailing>
          <div class="flex w-full items-center justify-between">
            <span>Line 1, Column 1</span>
            <span>JavaScript</span>
          </div>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
