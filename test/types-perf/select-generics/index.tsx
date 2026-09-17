import { Combobox, MultiSelect, Select } from 'moraine'
import type { MultiSelectProps, SelectT } from 'moraine'

interface UserItem extends SelectT.Item<number> {
  email: string
  active: boolean
}

const items: UserItem[] = [
  { value: 1, label: 'One', email: 'one@example.com', active: true },
  { value: 2, label: 'Two', email: 'two@example.com', active: false },
]
const grouped: SelectT.Entry<UserItem>[] = [{ type: 'group', label: 'Users', items }]

;<Select
  items={grouped}
  value={1}
  itemRender={({ item }) => item.email}
  itemToLabelString={(item) => item.email}
  onChange={(value) => {
    const selected: number | null = value
    void selected
  }}
/>
;<Combobox
  items={grouped}
  value={2}
  itemRender={({ item }) => item.email}
  itemToLabelString={(item) => item.email}
  filterItem={(query, item) => item.email.includes(query)}
  onChange={(value) => {
    const selected: number | null = value
    void selected
  }}
/>
;<MultiSelect<UserItem>
  items={grouped}
  value={[1, 999]}
  itemRender={({ item }) => item.email}
  itemToLabelString={(item) => item.email}
  filterItem={(query, item) => item.email.includes(query)}
  createItem={(input) => ({ value: input.length, label: input, email: input, active: true })}
  onChange={(value) => {
    const selected: number[] = value
    void selected
  }}
/>
;<Select items={[{ value: 'one', label: 'One' }]} value="unresolved" />
;<MultiSelect items={[{ value: 'one', label: 'One' }]} value={['one', 'unresolved']} />
// @ts-expect-error Numeric item collections reject string values.
;<Select<UserItem> items={items} value="one" />
// @ts-expect-error createItem must preserve the consumer item shape.
const invalidCreateItem: NonNullable<MultiSelectProps<UserItem>['createItem']> = (input) => ({
  value: input.length,
  label: input,
})
;<MultiSelect<UserItem> items={items} createItem={invalidCreateItem} />
