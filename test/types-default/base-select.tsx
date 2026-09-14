import { BaseSelect, Button, MultiSelect, Select } from 'moraine'
import type { BaseSelectT } from 'moraine'

interface UserItem extends BaseSelectT.Item<number> {
  email: string
}
const items: UserItem[] = [{ value: 1, label: 'One', email: 'one@example.com' }]
const group: BaseSelectT.Group<UserItem> = { type: 'group', label: 'Users', items }
;<BaseSelect<UserItem>
  items={[group]}
  onChange={(value) => {
    const number: number | null = value
    void number
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
;<BaseSelect.Trigger<'button', UserItem>>
  {(state) => state.selectedItems[0]?.email}
</BaseSelect.Trigger>
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
// @ts-expect-error Single selection cannot receive an array.
;<BaseSelect<UserItem> value={[1]} />
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
;<Select
  items={items}
  itemRender={(state) => state.item.label}
  filterItem={(_, item) => item.value === 1}
/>
;<MultiSelect items={items} />
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
