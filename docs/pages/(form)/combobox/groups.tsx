import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const TECH_GROUPS: ComboboxT.Entry[] = [
  {
    type: 'group',
    label: 'Frontend Frameworks',
    items: [
      { label: 'SolidJS', value: 'solid', icon: 'i-lucide:atom' },
      { label: 'Vue.js', value: 'vue', icon: 'i-lucide:sparkles' },
      { label: 'React', value: 'react', icon: 'i-lucide:box' },
      { label: 'Svelte', value: 'svelte', icon: 'i-lucide:flame' },
    ],
  },
  {
    type: 'group',
    label: 'Backend & Systems',
    items: [
      { label: 'Rust', value: 'rust', icon: 'i-lucide:cog' },
      { label: 'Go', value: 'go', icon: 'i-lucide:zap' },
      { label: 'Node.js', value: 'node', icon: 'i-lucide:server' },
    ],
  },
  {
    type: 'group',
    label: 'Databases',
    items: [
      { label: 'PostgreSQL', value: 'postgres', icon: 'i-lucide:database' },
      { label: 'Redis', value: 'redis', icon: 'i-lucide:database' },
      { label: 'SQLite', value: 'sqlite', icon: 'i-lucide:database' },
    ],
  },
]

export function Groups() {
  return (
    <div class="max-w-xs w-full space-y-2">
      <Combobox
        items={TECH_GROUPS}
        placeholder="Filter technologies..."
        leadingIcon="i-lucide:search"
        openOnControlClick
        emptyRender={(ctx) => (
          <div class="text-muted-foreground p-3 text-center text-xs">
            No technology found matching &ldquo;
            <span class="text-foreground font-medium">{ctx.inputValue}</span>&rdquo;.
          </div>
        )}
      />
    </div>
  )
}
