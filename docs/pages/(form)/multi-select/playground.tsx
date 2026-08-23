import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const TAG_OPTIONS: MultiSelectT.Item[] = [
  { label: 'Design', value: 'design', icon: 'i-lucide:palette' },
  { label: 'Development', value: 'dev', icon: 'i-lucide:code' },
  { label: 'Marketing', value: 'marketing', icon: 'i-lucide:megaphone' },
  { label: 'Product', value: 'product', icon: 'i-lucide:layers' },
  { label: 'Research', value: 'research', icon: 'i-lucide:search' },
]

export interface MultiSelectPlaygroundProps {
  placeholder?: string
  variant?: MultiSelectT.Variant['variant']
  size?: MultiSelectT.Variant['size']
  disabled?: boolean
  loading?: boolean
}

export function MultiSelectPlayground(props: MultiSelectPlaygroundProps) {
  const [selected, setSelected] = createSignal<MultiSelectT.Value[]>(['design', 'dev'])

  return (
    <div class="max-w-full w-80">
      <MultiSelect
        options={TAG_OPTIONS}
        value={selected()}
        onChange={setSelected}
        placeholder={props.placeholder ?? 'Select tags...'}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        loading={props.loading ?? false}
        allowClear
      />
    </div>
  )
}
