import { Button, Icon, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function HeaderFooter() {
  const [composerValue, setComposerValue] = createSignal('Hello Moraine!')

  return (
    <div class="gap-6 grid lg:grid-cols-3">
      <Textarea
        placeholder="Ask, search or chat..."
        header={
          <>
            <span class="font-semibold">Info text</span>
            <Icon name="i-lucide-info" class="text-base ms-auto" />
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
        autoResize
        footer={
          <>
            <span>{composerValue().length}/280 characters</span>
          <Button size="sm" class="ms-auto">
              Send
            </Button>
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
            <Icon name="i-lucide-code" class="text-base" />
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
  )
}
