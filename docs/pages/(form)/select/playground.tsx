import { Select } from '@src'
import type { SelectT } from '@src'

const FRUIT_OPTIONS: SelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
]

export interface SelectPlaygroundProps {
  placeholder?: string
  disabled?: boolean
  search?: boolean
}

export function SelectPlayground(props: SelectPlaygroundProps) {
  return (
    <div class="w-80">
      <Select
        options={FRUIT_OPTIONS}
        placeholder={props.placeholder ?? 'Select a fruit'}
        disabled={props.disabled ?? false}
        search={props.search ?? false}
      />
    </div>
  )
}
