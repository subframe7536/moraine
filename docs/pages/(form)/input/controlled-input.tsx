import { Input } from '@src'
import { createSignal } from 'solid-js'

export function ControlledInput() {
  const [query, setQuery] = createSignal('')

  return (
    <div class="max-w-md w-full space-y-3">
      <Input
        value={query()}
        onValueChange={setQuery}
        placeholder="Type to search documentation..."
      />
      <p class="text-xs text-muted-foreground">
        Live search query: <span class="text-foreground font-medium">{query() || '(empty)'}</span>
      </p>
    </div>
  )
}
