import { Input, ListBox } from '@src'
import type { ListBoxT } from '@src'
import { createSignal } from 'solid-js'

export function Filter() {
  const ITEMS: ListBoxT.Item[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ]
  const [searchValue, setSearchValue] = createSignal('')

  return (
    <div class="max-w-sm space-y-2">
      <Input
        value={searchValue()}
        onInput={(event) => setSearchValue(event.currentTarget.value)}
        placeholder="Filter fruit"
      />
      <ListBox items={ITEMS} searchValue={searchValue()} />
    </div>
  )
}
