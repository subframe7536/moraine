import { Textarea } from '@src'
import { createSignal } from 'solid-js'

const MAX_LENGTH = 160

export function CharacterCount() {
  const [value, setValue] = createSignal('')

  return (
    <Textarea
      value={value()}
      maxLength={MAX_LENGTH}
      onValueChange={setValue}
      placeholder="Add a short description..."
      footer={
        <span class="text-xs text-muted-foreground">
          {value().length}/{MAX_LENGTH}
        </span>
      }
    />
  )
}
