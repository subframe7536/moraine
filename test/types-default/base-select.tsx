import { BaseSelect, Button, Combobox, MultiSelect, Select } from 'moraine'
import type { BaseSelectT, SelectT } from 'moraine'

interface UserItem extends BaseSelectT.Item<number> {
  email: string
}
interface BusinessItem extends BaseSelectT.Item<string> {
  type: 'group'
  department: string
}
const items: UserItem[] = [{ value: 1, label: 'One', email: 'one@example.com' }]
const group: SelectT.Group<UserItem> = { type: 'group', label: 'Users', items }
;<BaseSelect<UserItem>
  items={items}
  onChange={(value) => {
    const numbers: number[] = value
    void numbers
  }}
  itemToLabelString={(item) => item.email}
/>
;<BaseSelect<UserItem>
  items={items}
  multiple
  onChange={(values) => {
    const numbers: number[] = values
    void numbers
  }}
/>
;<BaseSelect.Item item={items[0]}>{(state) => state.item.email}</BaseSelect.Item>
;<BaseSelect.Trigger<'button', UserItem>>{(state) => state.value.join(',')}</BaseSelect.Trigger>
;<BaseSelect.Trigger as={Button} loading>
  Choose
</BaseSelect.Trigger>
const Custom = (props: { custom: string; children?: import('solid-js').JSX.Element }) => (
  <button>
    {props.custom}
    {props.children}
  </button>
)
;<BaseSelect.Trigger as={Custom} custom="custom" />
// @ts-expect-error Custom component props are required.
;<BaseSelect.Trigger as={Custom} />
// @ts-expect-error Value comes from the item's numeric value.
;<BaseSelect<UserItem> items={items} value="one" />
// @ts-expect-error Multiple selection requires an array.
;<BaseSelect<UserItem> multiple value={1} />
;<BaseSelect<UserItem> value={[1, 2]} />
// @ts-expect-error The root does not own a layout element.
;<BaseSelect items={items} class="root" />
// @ts-expect-error Search belongs to the high-level controls.
;<BaseSelect items={items} search />
// @ts-expect-error Only Trigger is polymorphic.
;<BaseSelect.Content as="section" />
// @ts-expect-error Only Trigger is polymorphic.
;<BaseSelect.Listbox as="ul" />
// @ts-expect-error Only Trigger is polymorphic.
;<BaseSelect.Item as="li" item={items[0]} />
// @ts-expect-error Only Trigger is polymorphic.
;<BaseSelect.GroupLabel as="span" />
;<Combobox
  items={items}
  itemRender={(state) => state.item.label}
  filterItem={(_, item) => item.value === 1}
/>
;<MultiSelect items={items} />
// @ts-expect-error MultiSelect always remains open after item selection.
;<MultiSelect items={items} closeOnSelect />
// @ts-expect-error Select and MultiSelect expose control, not root, as their styling slot.
;<Select items={items} classes={{ root: 'invalid' }} />
// @ts-expect-error Select and MultiSelect expose control, not root, as their styling slot.
;<MultiSelect items={items} styles={{ root: { width: '1px' } }} />
;<Select<BusinessItem>
  items={[
    { type: 'group', value: 'business', label: 'Business', department: 'sales' },
    {
      type: 'group',
      label: 'Departments',
      items: [{ type: 'group', value: 'engineering', label: 'Engineering', department: 'dev' }],
    },
  ]}
  itemRender={({ item }) => item.department}
/>
// @ts-expect-error Old collection terminology is removed.
;<Select options={items} />
// @ts-expect-error Old collection terminology is removed.
;<MultiSelect options={items} />
// @ts-expect-error Old renderer is removed.
;<Select optionRender={() => null} />
// @ts-expect-error Old filter is removed.
;<Select filterOption={false} />
// @ts-expect-error Old label renderer is removed.
;<Select labelRender={() => null} />
// @ts-expect-error Old renderer is removed.
;<MultiSelect optionRender={() => null} />
// @ts-expect-error Old filter is removed.
;<MultiSelect filterOption={false} />
// @ts-expect-error Old label renderer is removed.
;<MultiSelect labelRender={() => null} />

;<Combobox<UserItem>
  items={[group]}
  value={1}
  itemRender={({ item }) => item.email}
  itemProps={({ item }) => ({ title: item.email })}
  filterItem={(query, item) => item.email.includes(query)}
  itemToLabelString={(item) => item.email}
  scrollToItem={(item) => {
    const email: string = item.email
    void email
  }}
  virtualRender={(props) => {
    for (const row of props.entries) {
      if (row.type === 'item') {
        const email: string = row.item.email
        void email
      }
    }
    return null
  }}
  onChange={(value) => {
    const number: number | null = value
    void number
  }}
/>
;<MultiSelect<UserItem>
  items={[group]}
  createItem={(input) => ({ value: input.length, label: input, email: input })}
  itemRender={({ item }) => item.email}
  filterItem={(query, item) => item.email.includes(query)}
  itemToLabelString={(item) => item.email}
  scrollToItem={(item) => {
    const email: string = item.email
    void email
  }}
  virtualRender={(props) => {
    for (const row of props.entries) {
      if (row.type === 'item') {
        const email: string = row.item.email
        void email
      }
    }
    return null
  }}
  tagRender={(props) => {
    const item: UserItem | undefined = props.item
    const number: number = props.value
    void number
    return item?.email ?? props.label
  }}
/>
// @ts-expect-error A factory must supply every required consumer field.
;<MultiSelect<UserItem> createItem={(input) => ({ value: input.length, label: input })} />
// @ts-expect-error BaseSelect accepts only flat navigation items.
;<BaseSelect<UserItem> items={[group]} />
;<BaseSelect.Trigger<'button', UserItem>>
  {(state) => {
    // @ts-expect-error Canonical selected items belong to high-level controls.
    return state.selectedItems
  }}
</BaseSelect.Trigger>
;<BaseSelect<UserItem>
  isItemDisabled={(item, values) => item.email.length > 0 && values.includes(item.value)}
  onReset={() => {}}
/>
;<BaseSelect.Content onExitComplete={() => {}} />
