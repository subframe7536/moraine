import { Button, Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

interface FrameworkItem extends SelectT.Item {
  badge: string
}

const FRAMEWORKS: FrameworkItem[] = [
  { label: 'SolidJS', value: 'solid', badge: 'Reactive' },
  { label: 'Vue.js', value: 'vue', badge: 'Template' },
  { label: 'React', value: 'react', badge: 'Virtual DOM' },
]

export function CustomRender() {
  const [items, setItems] = createSignal<FrameworkItem[]>(FRAMEWORKS)

  return (
    <div class="max-w-xs w-full space-y-3">
      <Select<FrameworkItem>
        placeholder="Choose framework..."
        items={items()}
        defaultValue="solid"
        itemRender={(props) => (
          <div class="flex w-full items-center justify-between">
            <span>{props.item.label}</span>
            <span class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-muted">
              {props.item.badge}
            </span>
          </div>
        )}
        emptyRender={(props) => (
          <div class="p-3 text-center space-y-2">
            <p class="text-sm text-muted-foreground">No options available.</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setItems(FRAMEWORKS)
                props.close()
              }}
            >
              Restore options
            </Button>
          </div>
        )}
      />
      <div class="flex justify-end">
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setItems(items().length > 0 ? [] : FRAMEWORKS)}
        >
          Toggle empty list
        </Button>
      </div>
    </div>
  )
}
