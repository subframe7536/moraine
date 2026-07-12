import { ListBox } from '@src'
import type { ListBoxT } from '@src'

export function Basic() {
  const ITEMS: ListBoxT.Entry[] = [
    { type: 'label', label: 'Fruit' },
    { value: 'apple', label: 'Apple', description: 'Crisp and sweet' },
    { value: 'banana', label: 'Banana', description: 'Soft and mellow' },
    { type: 'separator' },
    { value: 'cherry', label: 'Cherry', disabled: true },
  ]
  return <ListBox class="max-w-sm" items={ITEMS} />
}
