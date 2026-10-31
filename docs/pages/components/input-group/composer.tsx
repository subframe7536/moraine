import { Button, Icon, InputGroup, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function Composer() {
  const [value, setValue] = createSignal('')
  return (
    <div class="max-w-md w-full">
      <InputGroup orientation="vertical">
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
          <div class="flex gap-2 w-full items-center justify-between">
            <span>{value().length} characters</span>
            <Button type="button" size="xs" disabled={!value()} onClick={() => setValue('')}>
              Clear
            </Button>
          </div>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
