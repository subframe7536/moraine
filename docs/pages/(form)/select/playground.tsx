import { Select } from '@src'
import type { SelectT } from '@src'

const TECH_OPTIONS: SelectT.Item[] = [
  { label: 'SolidJS', value: 'solid', icon: 'i-lucide:atom' },
  { label: 'Vue.js', value: 'vue', icon: 'i-lucide:sparkles' },
  { label: 'React', value: 'react', icon: 'i-lucide:box' },
  { label: 'Svelte', value: 'svelte', icon: 'i-lucide:flame' },
  { label: 'Astro', value: 'astro', icon: 'i-lucide:rocket' },
]

export interface SelectPlaygroundProps {
  placeholder?: string
  variant?: SelectT.Variant['variant']
  size?: SelectT.Variant['size']
  disabled?: boolean
  search?: boolean
}

export function SelectPlayground(props: SelectPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <Select
        options={TECH_OPTIONS}
        placeholder={props.placeholder ?? 'Select a framework...'}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        search={props.search ?? false}
        allowClear
      />
    </div>
  )
}
