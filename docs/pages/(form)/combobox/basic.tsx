import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const FRAMEWORKS: ComboboxT.Item[] = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'React', value: 'react' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Astro', value: 'astro' },
  { label: 'Next.js', value: 'next' },
  { label: 'Nuxt', value: 'nuxt' },
]

export function Basic() {
  return (
    <div class="max-w-xs w-full">
      <Combobox
        items={FRAMEWORKS}
        placeholder="Search framework..."
        leadingIcon="i-lucide:search"
        allowClear
      />
    </div>
  )
}
