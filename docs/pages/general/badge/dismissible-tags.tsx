import { Badge, Button } from '@src'
import { For, createSignal } from 'solid-js'

export function DismissibleTags() {
  const INITIAL_TAGS = ['Design', 'SolidJS', 'Kobalte', 'UnoCSS']

  const [tags, setTags] = createSignal(INITIAL_TAGS)

  return (
    <div class="flex flex-col gap-3 items-start">
      <div class="flex flex-wrap gap-2 max-w-2xl">
        <For each={tags()}>
          {(tag) => (
            <Badge
              variant="default"
              trailing="icon-close"
              title={tag}
              classes={{
                root: 'pe-0',
                trailing: 'hover:bg-accent rounded scale-80',
              }}
              onTrailingClick={() => setTags((current) => current.filter((item) => item !== tag))}
            >
              {tag}
            </Badge>
          )}
        </For>
      </div>

      <Button size="sm" variant="outline" onClick={() => setTags(INITIAL_TAGS)}>
        Reset tags
      </Button>
    </div>
  )
}
