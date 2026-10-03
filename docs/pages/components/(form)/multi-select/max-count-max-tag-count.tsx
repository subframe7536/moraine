import { Icon, MultiSelect, Tooltip } from '@src'
import type { MultiSelectT } from '@src'
import { For } from 'solid-js'

const TECH_STACK: MultiSelectT.Item[] = [
  { label: 'SolidJS', value: 'solid', icon: 'i-lucide:atom' },
  { label: 'TypeScript', value: 'ts', icon: 'i-lucide:code' },
  { label: 'Tailwind CSS', value: 'tailwind', icon: 'i-lucide:palette' },
  { label: 'Rust', value: 'rust', icon: 'i-lucide:cog' },
  { label: 'Docker', value: 'docker', icon: 'i-lucide:container' },
]

export function MaxCountMaxTagCount() {
  return (
    <div class="gap-6 grid max-w-2xl w-full sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">
          Selection Limit (maxCount = 2)
        </label>
        <MultiSelect
          items={TECH_STACK}
          maxCount={2}
          placeholder="Select up to 2 skills..."
          defaultValue={['solid']}
          search
          openOnControlClick
        />
        <p class="text-xs text-muted-foreground">
          Hard cap: prevents adding more once limit is reached.
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">
          Display Limit (maxTagCount = 1)
        </label>
        <MultiSelect
          items={TECH_STACK}
          defaultValue={['solid', 'ts', 'tailwind']}
          maxTagCount={1}
          tagOverflow={(props) => (
            <Tooltip openDelay={200}>
              <Tooltip.Trigger
                as="span"
                class="text-muted-foreground px-1 flex cursor-default items-center"
              >
                +{props.count}
              </Tooltip.Trigger>
              <Tooltip.Content class="p-2 flex gap-1">
                <For each={props.tags}>
                  {(tag) => (
                    <span class="px-2 py-1 rounded bg-muted flex gap-1.5 items-center">
                      {tag.label}
                      <Icon name="i-lucide:x" class="text-muted-foreground size-3.5" />
                    </span>
                  )}
                </For>
              </Tooltip.Content>
            </Tooltip>
          )}
          placeholder="Select tags..."
          search
          openOnControlClick
        />
        <p class="text-xs text-muted-foreground">
          Visual only: hover +N to inspect the collapsed tags.
        </p>
      </div>
    </div>
  )
}
