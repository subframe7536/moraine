import { Button, Icon, InputGroup, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function Composer() {
  const [value, setValue] = createSignal('')
  return (
    <InputGroup orientation="vertical" class="max-w-md w-full">
      <InputGroup.Leading>
        <Icon name="i-lucide:message-square" />
        Comment
      </InputGroup.Leading>
      <Textarea
        aria-label="Comment"
        value={value()}
        onValueChange={(next) => setValue(next ?? '')}
        placeholder="Write a comment..."
        autoResize
        rows={3}
        maxRows={8}
      />
      <InputGroup.Trailing>
        <span>{value().length} characters</span>
        <Button
          type="button"
          size="xs"
          class="ms-auto"
          disabled={!value()}
          onClick={() => setValue('')}
        >
          Clear
        </Button>
      </InputGroup.Trailing>
    </InputGroup>
  )
}
