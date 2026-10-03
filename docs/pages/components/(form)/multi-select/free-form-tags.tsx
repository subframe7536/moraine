import { MultiSelect } from '@src'
import { createSignal } from 'solid-js'

export function FreeFormTags() {
  const [tags, setTags] = createSignal<string[]>(['web', 'ui', 'components'])

  return (
    <div class="max-w-md w-full space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">
        Free-Form Tags (Comma or space separated)
      </label>
      <MultiSelect
        value={tags()}
        onValueChange={setTags}
        createItem={(input) => ({ value: input.trim().toLowerCase(), label: input.trim() })}
        tokenSeparators={[',', ' ']}
        placeholder="Type words, press space or comma..."
        allowClear
      />
      <p class="text-xs text-muted-foreground">Tags array: {JSON.stringify(tags())}</p>
    </div>
  )
}
