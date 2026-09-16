import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

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
          placeholder="Select tags..."
          search
          openOnControlClick
        />
        <p class="text-xs text-muted-foreground">
          Visual only: collapses excess tags into a +N badge.
        </p>
      </div>
    </div>
  )
}
