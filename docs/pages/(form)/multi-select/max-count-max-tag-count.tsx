import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

export function MaxCountMaxTagCount() {
  const TECH_STACK: MultiSelectT.Item[] = [
    { label: 'SolidJS', value: 'solid', icon: 'i-lucide:atom' },
    { label: 'TypeScript', value: 'ts', icon: 'i-lucide:code' },
    { label: 'Tailwind CSS', value: 'tailwind', icon: 'i-lucide:palette' },
    { label: 'GraphQL', value: 'graphql', icon: 'i-lucide:network' },
    { label: 'Rust', value: 'rust', icon: 'i-lucide:cog' },
    { label: 'Docker', value: 'docker', icon: 'i-lucide:container' },
  ]

  return (
    <div class="gap-6 grid max-w-2xl w-full sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">
          Primary competencies (Max 2 selections)
        </label>
        <MultiSelect
          options={TECH_STACK}
          maxCount={2}
          placeholder="Select up to 2 skills..."
          defaultValue={['solid']}
        />
        <p class="text-xs text-muted-foreground">Stops selection when limit is reached.</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">
          Project tags (Compact overflow +2)
        </label>
        <MultiSelect
          options={TECH_STACK}
          defaultValue={['solid', 'ts', 'tailwind']}
          maxTagCount={1}
          placeholder="Select tags..."
        />
        <p class="text-xs text-muted-foreground">Collapses surplus tags into a count badge.</p>
      </div>
    </div>
  )
}
