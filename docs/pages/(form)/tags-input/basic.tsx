import { TagsInput } from '@src'
import { createSignal } from 'solid-js'

export function Basic() {
  const [draft, setDraft] = createSignal('')
  return (
    <div class="max-w-xs space-y-2">
      <TagsInput
        defaultValue={['solid']}
        inputValue={draft()}
        onInputValueChange={setDraft}
        placeholder="Add a tag"
        allowClear
      />
      <p class="text-xs text-muted-foreground">Draft: {draft() || 'empty'}</p>
    </div>
  )
}
