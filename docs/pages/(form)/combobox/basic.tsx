import { Combobox } from '@src'

const ITEMS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
]

export function Basic() {
  return <Combobox class="max-w-xs" items={ITEMS} placeholder="Search frameworks..." allowClear />
}
