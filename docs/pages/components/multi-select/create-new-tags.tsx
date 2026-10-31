import { Button, MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const INITIAL_TOPICS: MultiSelectT.Item[] = [
  { label: 'React', value: 'react' },
  { label: 'SolidJS', value: 'solid' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'TypeScript', value: 'ts' },
]

export function CreateNewTags() {
  const [tags, setTags] = createSignal<MultiSelectT.Item['value'][]>(['solid'])

  return (
    <div class="max-w-md w-full space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">
        Topics (Select existing or type to create)
      </label>
      <MultiSelect
        search
        items={INITIAL_TOPICS}
        value={tags()}
        onValueChange={setTags}
        createItem={(input) => ({ value: input.trim().toLowerCase(), label: input.trim() })}
        tokenSeparators={[',', ';']}
        placeholder="Type to create or select..."
        openOnControlClick
        allowClear
        emptyRender={(ctx) => (
          <div class="p-2 text-center">
            <Button
              variant="link"
              size="sm"
              class="text-xs text-primary"
              onClick={() => ctx.create()}
            >
              Create &ldquo;{ctx.inputValue}&rdquo;
            </Button>
          </div>
        )}
      />
      <p class="text-xs text-muted-foreground">Selected values: {tags().join(', ') || 'none'}</p>
    </div>
  )
}
