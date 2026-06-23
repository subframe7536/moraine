import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

export function CreateNewTags() {
  const FRUIT_OPTIONS: MultiSelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  const [createTagValues, setCreateTagValues] = createSignal<MultiSelectT.Value[]>([])

  return (
    <div class="w-80 space-y-2">
      <MultiSelect
        search
        loading
        options={FRUIT_OPTIONS}
        value={createTagValues()}
        onChange={setCreateTagValues}
        allowCreate
        placeholder="Type to create tags..."
        emptyRender={(ctx) => (
          <div class="p-2 text-center">
            <button
              type="button"
              class="text-sm text-primary cursor-pointer hover:underline"
              onClick={() => ctx.create()}
            >
              Create &ldquo;{ctx.inputValue}&rdquo;
            </button>
          </div>
        )}
      />
      <p class="text-xs text-muted-foreground">Tags: {createTagValues().join(', ') || 'none'}</p>
    </div>
  )
}
