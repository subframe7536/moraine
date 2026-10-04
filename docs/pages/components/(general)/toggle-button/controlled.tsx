import { Button, ToggleButton } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [pressed, setPressed] = createSignal(false)
  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-3 items-center">
        <ToggleButton pressed={pressed()} onPressedChange={setPressed} leading="i-lucide:pin">
          Pin conversation
        </ToggleButton>
        <Button variant="outline" size="sm" onClick={() => setPressed(false)}>
          Reset
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        Conversation: <output aria-live="polite">{pressed() ? 'Pinned' : 'Unpinned'}</output>
      </p>
    </div>
  )
}
