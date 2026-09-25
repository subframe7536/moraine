import { Textarea, InputGroup } from '@src'
import { createSignal } from 'solid-js'

const MAX_LENGTH = 160

export function CharacterCount() {
  const [value, setValue] = createSignal('')

  return (
    <InputGroup orientation="vertical">
      <Textarea
        value={value()}
        maxLength={MAX_LENGTH}
        onValueChange={setValue}
        placeholder="Add a short description..."
      />
      <InputGroup.Trailing>
        <span class="text-muted-foreground text-xs">
          {value().length}/{MAX_LENGTH}
        </span>
      </InputGroup.Trailing>
    </InputGroup>
  )
}
