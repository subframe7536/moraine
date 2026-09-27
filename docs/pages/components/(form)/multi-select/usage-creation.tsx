import { MultiSelect } from '@src'
import { createSignal } from 'solid-js'

export function UsageCreation() {
  const [tags, setTags] = createSignal<string[]>(['frontend', 'performance'])

  return (
    <div class="max-w-md w-full space-y-2">
      <MultiSelect
        value={tags()}
        onValueChange={setTags}
        createItem={(input) => ({ label: input.trim(), value: input.trim().toLowerCase() })}
        tokenSeparators={[',', ' ']}
        placeholder="Type and press Enter, comma, or space..."
        allowClear
      />
      <p class="text-muted-foreground text-xs">
        Active tags:{' '}
        <span class="text-foreground font-medium font-mono">{tags().join(', ') || '(none)'}</span>
      </p>
    </div>
  )
}
