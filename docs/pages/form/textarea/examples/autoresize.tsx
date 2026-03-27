import { Textarea } from '@src'
import { createSignal } from 'solid-js'

export function Autoresize() {
  const [value, setValue] = createSignal('Type here to see autoresize...')

  return (
    <div class="max-w-xl space-y-3">
      <Textarea
        autoresize
        maxrows={6}
        value={value()}
        onValueChange={(next) => setValue(String(next ?? ''))}
        placeholder="Start typing..."
      />
      <p class="text-xs text-muted-foreground">Characters: {value().length}</p>
      <Textarea disabled value="Disabled textarea state" rows={2} />
    </div>
  )
}
