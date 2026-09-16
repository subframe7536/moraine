import { MultiSelect } from '@src'
import { createSignal } from 'solid-js'

export function FreeFormTags() {
  const [tags, setTags] = createSignal<string[]>([])

  return (
    <div class="w-80 space-y-2">
      <MultiSelect
        value={tags()}
        onChange={setTags}
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[',']}
        placeholder="Type or paste comma-separated tags..."
      />
      <p class="text-xs text-muted-foreground">Tags: {tags().join(', ') || 'none'}</p>
    </div>
  )
}
