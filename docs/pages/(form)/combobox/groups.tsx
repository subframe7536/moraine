import { Combobox } from '@src'

export function Groups() {
  return (
    <Combobox
      class="max-w-xs"
      placeholder="Category by group"
      items={[
        {
          type: 'group',
          label: 'Frontend',
          items: [
            { label: 'SolidJS', value: 'solid' },
            { label: 'Vue', value: 'vue' },
          ],
        },
        {
          type: 'group',
          label: 'Backend',
          items: [{ label: 'Rust', value: 'rust' }],
        },
      ]}
      emptyRender={(props) => <span>No match for {props.inputValue}</span>}
    />
  )
}
