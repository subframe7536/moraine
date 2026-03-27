import { Textarea } from '@src'
import { createSignal } from 'solid-js'

export function TextareaHeaderFooter() {
  const [composerValue, setComposerValue] = createSignal('Hello Moraine!')

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
  )
}
